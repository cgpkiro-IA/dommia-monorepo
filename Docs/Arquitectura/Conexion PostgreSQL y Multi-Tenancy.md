# Conexión PostgreSQL y Multi-Tenancy

**Estado:** Implementado localmente; staging/producción requieren despliegue de migraciones y configuración de secretos.
**Fuente de implementación:** `apps/api/src/database/database.service.ts`.

## Conexión y ciclo de vida

- `DatabaseService` crea un único `pg.Pool` por proceso NestJS, con `max: 20`, `idleTimeoutMillis: 30000` y `connectionTimeoutMillis: 5000`.
- Los parámetros se leen de `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_DB`. Los defaults del código son solo para desarrollo local; los entornos desplegados deben inyectar configuración/secretos explícitos.
- El pool comprueba conectividad al iniciar y se cierra mediante `pool.end()` al detener NestJS.
- Consultas globales utilizan `DatabaseService.query()`. Consultas tenant-scoped usan `queryTenant()`; operaciones atómicas usan `withTenantTransaction()`.

## Aislamiento de tenants

El esquema se deriva del slug normalizado como `tenant_<slug>`. Los alias históricos `las_palmas` y `laspalmas` se resuelven al tenant `demo`.

Para una consulta tenant-scoped, el servicio:

1. Adquiere un `PoolClient` del pool compartido.
2. Configura `search_path` con `SELECT set_config('search_path', $1, false)` y un valor ligado, nunca interpolando el slug en SQL.
3. Ejecuta la consulta en ese cliente, usando placeholders (`$1`, `$2`, etc.) para los datos.
4. Ejecuta `RESET search_path` en `finally` y libera el cliente. Si la limpieza falla, libera el cliente con error para que `pg` lo retire del pool.

`search_path` es estado de sesión de PostgreSQL; por ello, no se debe usar `pool.query()` para una consulta tenant-scoped ni hacer `SET search_path` en una conexión distinta a la que ejecuta el SQL.

`withTenantTransaction()` mantiene `BEGIN`, consultas, `COMMIT` o `ROLLBACK` en el mismo cliente y limpia `search_path` antes de devolverlo al pool. Todas las operaciones del callback deben usar el `client` recibido, no abrir consultas paralelas con `DatabaseService.queryTenant()`.

## SQL y repositorios

- Los valores se envían como parámetros de consultas preparadas. No concatenar entrada de usuario en SQL.
- Los identificadores SQL no se sustituyen con placeholders; para ellos se usa composición segura del driver/allowlist y validación explícita. El enrutamiento tenant actual evita interpolar el identificador: lo asigna como valor de `set_config`.
- Los controladores reciben HTTP y delegan en servicios; los servicios coordinan reglas de negocio y repositorios; los repositorios concentran SQL y persistencia.
- No crear tablas, índices ni ejecutar `ALTER TABLE` desde un endpoint, guard o flujo de request. El DDL va en `docker/migrations/*.sql` o en funciones de aprovisionamiento invocadas al crear un tenant.
- El SQL dinámico dentro de `public.ensure_tenant_feature_tables()` usa `format('%I', schema)` para identificadores de schema; la función comprueba que el schema exista.

## Migraciones y aprovisionamiento

Las migraciones existentes se aplican idempotentemente con `IF NOT EXISTS` cuando corresponde. No hay un runner de migraciones versionado en NestJS; aplicar las migraciones pendientes de forma explícita y ordenada antes del despliegue.

| Migración | Responsabilidad principal |
| --- | --- |
| `003_finance_campaign_ledger.sql` | Campañas anuales y ledger financiero. |
| `004_resident_access.sql` | Acceso de residentes e invitaciones. |
| `005_resident_contact_login.sql` | Login Resident por correo/teléfono y columnas de contacto. |
| `006_notification_channels.sql` | Configuración de canales premium de notificación. |
| `007_resident_password_resets.sql` | Recuperación de contraseña Resident. |
| `008_resident_sessions.sql` | Sesiones persistidas de Resident. |
| `009_stripe_events.sql` / `010_stripe_connected_accounts.sql` | Idempotencia de webhooks y cuentas conectadas Stripe. |
| `011_access_qr_replay_protection.sql` / `012_manual_access_audit.sql` | Protección anti-replay QR y auditoría de excepciones manuales. |
| `013_guard_operations.sql` | Tablas de operaciones Guard para tenants existentes. |
| `014_tenant_feature_tables.sql` | `public.ensure_tenant_feature_tables(slug)`, tablas de Resident, fees, avisos, campañas, ledger, Guard y actualización de tenants existentes. |
| `015_admin_mfa.sql` | Estado MFA en `public.users` y desafíos de login MFA. |
| `016_guard_services.sql` | Servicios y proveedores registrados por caseta. |
| `017_crm_alerts.sql` | Alertas de plataforma y configuración de Telegram del CRM. |
| `018_guard_consigns_and_panic.sql` | Audiencia y acuses en avisos; campos e índices para alertas de pánico. |
| `019_tenant_guard_schema_completion.sql` | Completa tablas, columnas e índices de Guard y bitácora para tenants existentes y nuevos. |
| `020_tenant_finance_schema_completion.sql` | Completa metraje, configuración de cuotas, cargos y pagos para tenants existentes y nuevos. |
| `021_resident_app_refresh_sessions.sql` | Sesiones móviles por dispositivo y almacenamiento hasheado/rotatorio de refresh tokens. |

El script `docker/init-db/03-tenant-feature-tables.sql` aplica las migraciones 003–021 en instalaciones nuevas. El bootstrap GCP de una base productiva vacía está en [`docker/production-bootstrap.sql`](../../docker/production-bootstrap.sql); carga la estructura y las migraciones sin conservar el tenant demo ni ejecutar el seed de usuarios. Al provisionar un tenant nuevo, `DatabaseService.provisionTenant()` ejecuta `provision_tenant_schema()`, `ensure_tenant_feature_tables($1)`, `ensure_tenant_finance_schema($1)` y `ensure_tenant_latest_guard_tables($1)`.

Aplicar las migraciones a una base existente desde la raíz del repositorio:

```bash
for migration in docker/migrations/*.sql; do
	docker exec -i dommia_postgres psql -v ON_ERROR_STOP=1 -U "${POSTGRES_USER:-dommia_admin}" -d "${POSTGRES_DB:-dommia_master}" < "$migration"
done
```

Los comandos usan por defecto los valores locales de Docker Compose; sobrescríbelos con `POSTGRES_USER` y `POSTGRES_DB` para otra instancia. Aplicar únicamente migraciones pendientes y revisar el destino antes de ejecutarlos. No apuntar pruebas o scripts locales a producción.

## Pruebas actuales

La suite E2E (`pnpm test`) requiere PostgreSQL accesible y el API levantado. El helper espera hasta 15 segundos por `/health` (configurable con `DOMMIA_TEST_STARTUP_TIMEOUT_MS`), aplica 003–021 idempotentemente, ejecuta el seed `scratch/seed_guard_qa.sql` y usa el tenant aislado `guard-qa`. Variables soportadas: `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DOMMIA_TEST_API_BASE` y `DOMMIA_TEST_STARTUP_TIMEOUT_MS`.

El alcance y el resultado más reciente están en [`Testing/README.md`](../../Testing/README.md). Las pruebas locales no sustituyen el despliegue/validación de migraciones en staging. Ejecuta [`docker/validate-schema.sql`](../../docker/validate-schema.sql) para detectar tablas, columnas, índices o funciones requeridas que falten en los schemas existentes.