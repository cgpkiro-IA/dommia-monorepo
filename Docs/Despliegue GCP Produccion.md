# Despliegue de DOMMIA en Google Cloud

**Estado:** Portal público estático publicado en Firebase Hosting. El despliegue de API, CRM, Communities, Resident, Guard y Cloud SQL en Cloud Run sigue pendiente de cerrar los bloqueos indicados en esta guía.
**Alcance:** MVP digital de DOMMIA. Cloud Run, Cloud SQL for PostgreSQL, Artifact Registry y Secret Manager.
**Entornos:** DEV local con Docker Compose; PROD en un proyecto GCP separado.

### Portal público en Firebase Hosting

El Portal de captación tiene una publicación estática independiente del despliegue SaaS en Cloud Run. Al 1 de octubre de 2026, `dommia.com.mx` responde con la landing de DOMMIA. El sitio Firebase es `dommia-saas-ef543`; los comandos, modo estático y límites de captación están en [`apps/portal-web/README.md`](../apps/portal-web/README.md). Esta publicación no implica que API, CRM, Communities, Resident, Guard o Cloud SQL estén desplegados en producción.

## 1. Decisión de despliegue

Producción se divide en seis servicios Cloud Run independientes:

| Servicio | Workspace | Función |
| --- | --- | --- |
| API | `apps/api` | API NestJS y acceso a PostgreSQL. |
| Portal | `apps/portal-web` | Sitio público, cotizador y captación. |
| CRM | `apps/crm-admin` | Backoffice SaaS. |
| Communities | `apps/communities-admin` | Administración de cada comunidad. |
| Resident | `apps/resident-pwa` | PWA para residentes. |
| Guard | `apps/guard-pwa` | PWA de operación de caseta. |

La API será el único servicio con acceso a Cloud SQL y Secret Manager. Los frontends no deben recibir credenciales de base de datos ni secretos del API. Cloud Run debe conectar con Cloud SQL mediante la integración administrada de Cloud SQL; no publicar PostgreSQL en una IP pública.

### Dominios oficiales de PROD

| Uso | Host HTTPS | Destino |
| --- | --- | --- |
| Portal público y dominio canónico | `dommia.com.mx` | Portal |
| API | `api.dommia.com.mx` | API |
| CRM | `crm.dommia.com.mx` | CRM |
| Administración de comunidades | `communities.dommia.com.mx` | Communities |
| App Resident y enlaces móviles | `app.dommia.com.mx` | Resident |
| Operación de caseta | `guard.dommia.com.mx` | Guard |
| Acceso estándar de tenants | `standar.dommia.com.mx/<slug>` | Communities |
| Subdominios propios | `<slug>.dommia.com.mx` | Communities, según plan y DNS |

Configura DNS y certificados TLS para cada host. El wildcard de tenants requiere cobertura TLS para `*.dommia.com.mx` y una capa de ruteo que soporte hosts wildcard, por ejemplo un External Application Load Balancer; no asumas que un mapping directo de Cloud Run lo cubre. Publica `/.well-known/assetlinks.json` y `/.well-known/apple-app-site-association` en `app.dommia.com.mx` antes de habilitar Android App Links y Apple Universal Links; esos archivos deben llevar los identificadores y firmas reales de cada app.

Si DOMMIA conserva control sobre `dommia.com`, mantén redirecciones HTTPS 301 desde las URLs web antiguas y alias/reenvío de correo durante la transición. La migración 027 actualiza hosts guardados de primera parte en la base, pero no cambia DNS, cuentas de correo, emails de usuarios ni correos de contacto.

EMQX, MQTT, gateways, RFID y apertura física quedan fuera del MVP. El `docker-compose.yml` actual sirve para desarrollo local y no es una topología de producción.

Usa un proyecto GCP dedicado, por ejemplo `dommia-prod`, una región aprobada por el negocio y el mapa de dominios oficiales indicado arriba.

## 2. Separación DEV y PROD

No copies variables ni secretos entre entornos. Usa valores, contraseñas y llaves criptográficas distintos.

### DEV local

- Docker Compose local proporciona PostgreSQL y EMQX.
- API: coloca las variables locales en `apps/api/.env.local`. NestJS carga `.env.local` y `.env` desde el directorio de ejecución.
- Next.js: coloca las variables públicas de desarrollo en el `.env.local` de cada app que las consume.
- Docker Compose puede recibir su configuración desde un `.env` en la raíz. Ese archivo es solo local y no debe contener valores de producción.
- Mantén los `.env.local` fuera de Git. El `.gitignore` ya ignora `.env*` y permite versionar `.env.example` si luego se necesita una plantilla sin secretos.

Perfil local del API:

```dotenv
NODE_ENV=development
API_PORT=4000
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=<usuario local de PostgreSQL>
POSTGRES_PASSWORD=<contraseña local de PostgreSQL>
POSTGRES_DB=dommia_master
AUTH_TOKEN_SECRET=<llave exclusiva de desarrollo, mínimo 32 caracteres>
RESIDENT_APP_TOKEN_SECRET=<llave distinta para sesiones nativas, mínimo 32 caracteres>
MFA_ENCRYPTION_KEY=<64 caracteres hexadecimales; obligatoria en producción>
GCS_FINANCE_EVIDENCE_BUCKET=<bucket privado de evidencias financieras>
RESIDENT_APP_URL=http://localhost:3003
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004
```

Next.js lee `.env.local` desde la raíz de cada aplicación. Los archivos locales ya preparados contienen:

| Archivo | Variables |
| --- | --- |
| `apps/portal-web/.env.local` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CRM_URL`. |
| `apps/crm-admin/.env.local` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_PORTAL_URL`, `NEXT_PUBLIC_COMMUNITIES_URL`. |
| `apps/communities-admin/.env.local` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_RESIDENT_APP_URL`, `NEXT_PUBLIC_CRM_URL`. |
| `apps/resident-pwa/.env.local` | `NEXT_PUBLIC_API_URL`. |
| `apps/guard-pwa/.env.local` | `NEXT_PUBLIC_API_URL`. |

`NEXT_PUBLIC_API_URL` usa `http://localhost:4000/api/v1` en DEV. Las cinco aplicaciones resuelven sus requests desde `src/lib/api-url.ts`; si falta la variable o no es una URL HTTP(S), el build falla. `NEXT_PUBLIC_SITE_URL` configura el SEO de Portal, `NEXT_PUBLIC_PORTAL_URL` el enlace a Portal desde CRM, `NEXT_PUBLIC_CRM_URL` los enlaces al CRM desde Portal y Communities, `NEXT_PUBLIC_COMMUNITIES_URL` el enlace desde CRM y `NEXT_PUBLIC_RESIDENT_APP_URL` los enlaces de activación desde Communities. `.env.local` está ignorado por Git y no se copia a PROD.

### PROD en GCP

- Variables no sensibles: configuración de entorno del servicio Cloud Run.
- Valores sensibles: Secret Manager, vinculados únicamente al servicio API que los necesita.
- `NEXT_PUBLIC_*`: configuración pública de build, definida por aplicación en el job que ejecuta `next build`. Next.js la incorpora al bundle del navegador; configurarla solo en Cloud Run después del build no cambia el bundle.
- No crear ni subir un `.env.production` con secretos. No pasar secretos como argumentos de build, variables de Docker build ni sustituciones visibles de Cloud Build.

## 3. Secretos de producción

Crea los secretos en Secret Manager dentro del proyecto PROD. Vincula versiones explícitas a cada revisión de Cloud Run y otorga `Secret Manager Secret Accessor` solo a la cuenta de servicio del API. No compartas las llaves con las PWAs.

| Nombre del secreto | Uso | Condición |
| --- | --- | --- |
| `AUTH_TOKEN_SECRET` | Firma y validación de sesiones y desafíos. | Obligatorio. Genera una llave aleatoria con al menos 32 caracteres. El API ahora impide arrancar en producción si falta o es demasiado corta. |
| `RESIDENT_APP_TOKEN_SECRET` | Firma/verificación de JWT de Android/iOS Resident. | Obligatorio para el contrato de apps. Genera una llave distinta de `AUTH_TOKEN_SECRET`, aleatoria, de al menos 32 caracteres. |
| `POSTGRES_USER` | Usuario de la aplicación en Cloud SQL. | Obligatorio. Crea un usuario de aplicación, no uses el usuario administrador de la instancia. |
| `POSTGRES_PASSWORD` | Contraseña del usuario de aplicación de Cloud SQL. | Obligatorio. Genera una contraseña aleatoria y rótala mediante un procedimiento controlado. |
| `MFA_ENCRYPTION_KEY` | Cifrado AES-256-GCM de secretos TOTP administrativos. | Obligatoria para arrancar el API en producción. Debe ser exactamente 64 caracteres hexadecimales y mantenerse estable para descifrar datos existentes. |
| `NOTIFICATIONS_ENCRYPTION_KEY` | Descifrado de configuración SMTP/WhatsApp guardada por tenant. | Configurar antes de activar `NOTIFICATIONS_PREMIUM` o guardar canales. Mantener la misma llave para poder leer configuraciones existentes. |
| `STRIPE_SECRET_KEY` | Acceso a Stripe. | No configurar para el MVP. Solo agregar cuando se apruebe y valide Stripe en sandbox y PROD. |
| `STRIPE_WEBHOOK_SECRET` | Verificación de firma de webhooks Stripe. | No configurar para el MVP. Se requiere junto con Stripe antes de habilitar cobros. |

Genera llaves fuera del repositorio. Ejemplos de generación, no son valores para copiar:

```sh
openssl rand -base64 48
openssl rand -hex 32
```

El primer comando puede generar `AUTH_TOKEN_SECRET`. El segundo genera una llave de 64 caracteres hexadecimales, válida para `MFA_ENCRYPTION_KEY`. `NOTIFICATIONS_ENCRYPTION_KEY` debe ser aleatoria, privada y persistente; no la cambies sin un plan para volver a cifrar las configuraciones existentes. No guardes los resultados en Git, tickets, logs o imágenes de contenedor.

Genera otro valor independiente con `openssl rand -hex 32` para `RESIDENT_APP_TOKEN_SECRET`. No reutilices `AUTH_TOKEN_SECRET`: la clave móvil firma una audiencia distinta y se guarda en su propia versión de Secret Manager.

Los tokens de WhatsApp y las credenciales SMTP son configuración por tenant que la aplicación cifra en PostgreSQL usando `NOTIFICATIONS_ENCRYPTION_KEY`. No son variables globales del servicio Cloud Run. Configura esos canales desde el flujo administrativo, con el entitlement contratado y después de validar envío y fallback en un entorno controlado.

## 4. Variables de entorno de Cloud Run

Configura estas variables en el servicio API:

| Variable | Valor PROD |
| --- | --- |
| `NODE_ENV` | `production`. |
| `PORT` | La define Cloud Run. El API ya la prioriza sobre `API_PORT`. No fijar otro puerto. |
| `POSTGRES_HOST` | `/cloudsql/<PROJECT_ID>:<REGION>:<CLOUD_SQL_INSTANCE>`. |
| `POSTGRES_PORT` | `5432`. |
| `POSTGRES_DB` | Nombre de la base productiva, por ejemplo `dommia_prod`. |
| `CORS_ORIGINS` | Lista separada por comas de los orígenes HTTPS exactos de Portal, CRM, Communities, Resident y Guard. Sin rutas ni barras finales. |
| `RESIDENT_APP_URL` | URL HTTPS pública de Resident. Se usa para enlaces de activación y recuperación de cuenta. |
| `GCS_FINANCE_EVIDENCE_BUCKET` | Nombre del bucket privado dedicado a evidencias de rendición financiera. Obligatorio en producción. |

`POSTGRES_USER`, `POSTGRES_PASSWORD`, `AUTH_TOKEN_SECRET`, `RESIDENT_APP_TOKEN_SECRET` y `MFA_ENCRYPTION_KEY` se inyectan desde Secret Manager. `NOTIFICATIONS_ENCRYPTION_KEY` se vincula al mismo servicio antes de guardar o leer credenciales de canales premium.

`ConfigModule` valida el entorno con Joi al iniciar. Producción requiere credenciales PostgreSQL, ambas llaves de firma (mínimo 32 caracteres), `MFA_ENCRYPTION_KEY` (64 hex), `RESIDENT_APP_URL` HTTPS, `CORS_ORIGINS` y `GCS_FINANCE_EVIDENCE_BUCKET`. El API rechaza una allowlist vacía, `*`, orígenes que no sean HTTPS o entradas con rutas. Helmet se instala globalmente para las cabeceras HTTP. CORS no sustituye autenticación ni autorización.

### Bucket privado de evidencias financieras

1. Crea un bucket regional o dual-region alineado con Cloud Run/Cloud SQL, con Public Access Prevention y Uniform Bucket-Level Access.
2. No publiques objetos ni entregues IAM a frontends/residentes. El API usa Application Default Credentials de la cuenta de servicio de Cloud Run.
3. Otorga a esa cuenta de servicio permisos mínimos de crear, leer y borrar objetos en el bucket dedicado. No uses una llave JSON dentro de la imagen ni del repositorio.
4. Configura cifrado administrado por Google o CMEK si lo exige la política; define retención/lifecycle conforme a obligaciones contables y privacidad.
5. Los objetos usan prefijos generados por servidor `tenants/<slug>/financial-evidence/<uuid>`; el slug del request nunca se usa sin autorización tenant.
6. Las descargas pasan por el API con `Cache-Control: private, no-store`. Solo copias redactadas y marcadas `RESIDENTS` se muestran a residentes.

Build variables de frontend, definidas antes de `next build`:

| Variable | Apps | Valor PROD |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | CRM, Communities, Portal, Resident y Guard. | `https://api.dommia.com.mx/api/v1`. |
| `NEXT_PUBLIC_SITE_URL` | Portal. | `https://dommia.com.mx`. |
| `NEXT_PUBLIC_PORTAL_URL` | CRM. | `https://dommia.com.mx`. |
| `NEXT_PUBLIC_CRM_URL` | Portal y Communities. | `https://crm.dommia.com.mx`. |
| `NEXT_PUBLIC_COMMUNITIES_URL` | CRM. | `https://communities.dommia.com.mx`. |
| `NEXT_PUBLIC_RESIDENT_APP_URL` | Communities. | `https://app.dommia.com.mx`. |
| `NEXT_PUBLIC_GA_ID` | Portal, opcional. | Identificador de Google Analytics, si se habilita. No es secreto. |
| `NEXT_PUBLIC_GTM_ID` | Portal, opcional. | Identificador de Google Tag Manager, si se habilita. No es secreto. |

Los valores `NEXT_PUBLIC_*` son públicos y quedan visibles en el navegador. Nunca pongas una contraseña, token privado o llave de cifrado en una variable con ese prefijo.

El job de build PROD asigna `NEXT_PUBLIC_API_URL=https://api.dommia.com.mx/api/v1` a los cinco frontends. Asigna además `NEXT_PUBLIC_SITE_URL=https://dommia.com.mx` y `NEXT_PUBLIC_CRM_URL=https://crm.dommia.com.mx` a Portal; `NEXT_PUBLIC_PORTAL_URL=https://dommia.com.mx` y `NEXT_PUBLIC_COMMUNITIES_URL=https://communities.dommia.com.mx` a CRM; `NEXT_PUBLIC_CRM_URL=https://crm.dommia.com.mx` y `NEXT_PUBLIC_RESIDENT_APP_URL=https://app.dommia.com.mx` a Communities. Resident y Guard solo requieren `NEXT_PUBLIC_API_URL`. Configura `RESIDENT_APP_URL=https://app.dommia.com.mx` en el API, `API_BASE_URL=https://api.dommia.com.mx/api/v1` en las apps móviles y `RESIDENT_APP_LINK_HOST=app.dommia.com.mx` en sus builds. No heredes ni uses los `.env.local` de DEV para construir imágenes PROD. Estos valores son configuración pública de build, no secretos de Secret Manager.

## 5. Preparación de GCP

1. Crea el proyecto PROD separado y define región, dominios, política de acceso y presupuesto.
2. Habilita Cloud Run, Cloud SQL Admin, Artifact Registry, Cloud Build, Secret Manager, Cloud Logging y Cloud Monitoring.
3. Crea una cuenta de servicio exclusiva para el API. Dale `Cloud SQL Client` y acceso de lectura a los secretos requeridos. Las cuentas de servicio de los frontends no necesitan permisos sobre Cloud SQL ni Secret Manager.
4. Crea Cloud SQL for PostgreSQL 16 con backups automáticos, recuperación a un punto en el tiempo y alta disponibilidad según el RPO/RTO aprobado. Restringe el acceso a la aplicación y al proceso administrativo de migración.
5. Crea Artifact Registry y almacena una imagen separada por workspace. Construye desde la raíz del monorepo para que el build pueda resolver `packages/shared-types` y `packages/ui`.
6. Crea las versiones iniciales de Secret Manager y vincúlalas al servicio API. No uses archivos `.env` en la imagen.
7. Configura Cloud Run con la cuenta de servicio del API, conexión a Cloud SQL, variables de entorno y secretos. Los cinco frontends no deben recibir secretos.
8. Configura DNS y certificados HTTPS para `dommia.com.mx`, `api.dommia.com.mx`, `crm.dommia.com.mx`, `communities.dommia.com.mx`, `app.dommia.com.mx`, `guard.dommia.com.mx`, `standar.dommia.com.mx` y `*.dommia.com.mx`. Define `CORS_ORIGINS=https://dommia.com.mx,https://crm.dommia.com.mx,https://communities.dommia.com.mx,https://app.dommia.com.mx,https://guard.dommia.com.mx,https://standar.dommia.com.mx` para los orígenes fijos. El API además admite HTTPS en subdominios de un solo nivel bajo `.dommia.com.mx` para los tenants. Todo dominio personalizado externo debe agregarse como origen exacto; no uses `*`.
9. Publica los archivos Android/iOS de asociación de dominios en `https://app.dommia.com.mx/.well-known/` y verifica los enlaces desde dispositivos físicos.
10. Configura alertas de errores 5xx, latencia, instancias, disponibilidad del API y capacidad/conexiones de Cloud SQL. El health check actual comprueba PostgreSQL; no confirma conectividad MQTT.

### Archivos que deben llevarse al proceso de producción

Mantén estos archivos en el checkout de la misma versión que vas a desplegar. No subas archivos sueltos a Cloud SQL Studio ni copies SQL dentro de una imagen de Cloud Run. El proceso de base de datos se ejecuta desde una máquina administrativa autorizada, conectada con Cloud SQL Auth Proxy.

**Bootstrap de una base nueva.** Conserva esta estructura relativa dentro del checkout:

```text
docker/production-bootstrap.sql
docker/init-db/01-init.sql
docker/validate-schema.sql
docker/migrations/003_finance_campaign_ledger.sql
docker/migrations/004_resident_access.sql
docker/migrations/005_resident_contact_login.sql
docker/migrations/006_notification_channels.sql
docker/migrations/007_resident_password_resets.sql
docker/migrations/008_resident_sessions.sql
docker/migrations/009_stripe_events.sql
docker/migrations/010_stripe_connected_accounts.sql
docker/migrations/011_access_qr_replay_protection.sql
docker/migrations/012_manual_access_audit.sql
docker/migrations/013_guard_operations.sql
docker/migrations/014_tenant_feature_tables.sql
docker/migrations/015_admin_mfa.sql
docker/migrations/016_guard_services.sql
docker/migrations/017_crm_alerts.sql
docker/migrations/018_guard_consigns_and_panic.sql
docker/migrations/019_tenant_guard_schema_completion.sql
docker/migrations/020_tenant_finance_schema_completion.sql
docker/migrations/021_resident_app_refresh_sessions.sql
docker/migrations/022_resident_push_tokens.sql
docker/migrations/023_tenant_monthly_financial_reports.sql
docker/migrations/024_guard_access_points.sql
docker/migrations/025_saas_plan_min_properties.sql
docker/migrations/026_saas_subscription_contracts.sql
docker/migrations/027_dommia_domain_mx.sql
```

`production-bootstrap.sql` incluye `init-db/01-init.sql` y cada migración mediante `\ir`, relativo al directorio del propio script. Debe estar presente la carpeta completa `docker/` con la estructura anterior. `validate-schema.sql` se ejecuta por separado después del bootstrap.

**Alta del primer administrador.** El comando está en `apps/api/scripts/bootstrap-first-admin.mjs` y se ejecuta con `corepack pnpm --filter @dommia/api bootstrap:first-admin`. Para que pnpm resuelva `pg` y el workspace, usa el checkout completo de la versión desplegada, incluidos `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `apps/api/package.json` y las dependencias instaladas con `pnpm install --frozen-lockfile`. No copies el script solo ni lo empaquetes como servicio público.

**Imágenes de Cloud Run.** Las imágenes se construyen desde el monorepo e incluyen el workspace correspondiente y los paquetes compartidos `packages/shared-types` y `packages/ui`. El repo todavía no tiene Dockerfiles ni configuración Cloud Build por aplicación; hasta cerrar ese bloqueo no existe un paquete de imágenes de producción listo. El operador de base de datos no necesita desplegar `docker-compose.yml`, datos QA ni carpetas `scratch/`.

Antes de abrir PROD, comprueba que los archivos SQL requeridos estén en el checkout:

```powershell
$required = @(
	"docker/production-bootstrap.sql",
	"docker/init-db/01-init.sql",
	"docker/validate-schema.sql"
) + (Get-ChildItem -Path ".\docker\migrations" -Filter "*.sql" | Where-Object {
	$version = 0
	[int]::TryParse($_.BaseName.Split('_')[0], [ref]$version) -and $version -ge 3 -and $version -le 27
} | ForEach-Object { $_.FullName })
$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing) { $missing; throw "Faltan artefactos SQL de producción." }
if ($required.Count -ne 28) { throw "Se esperaban 28 artefactos SQL, se encontraron $($required.Count)." }
Write-Output "Artefactos SQL presentes: $($required.Count)."
```

No lleves a PROD `docker/init-db/02-seed-demo-users.sql`, `docker/init-db/03-tenant-feature-tables.sql`, `scratch/`, `.env*`, contraseñas de DEV ni volúmenes Docker locales. Los secretos productivos se leen desde Secret Manager en el momento de operar.

### Primera creación de la base Cloud SQL

Ejecuta el Cloud SQL Auth Proxy en una terminal autenticada con una identidad autorizada:

```sh
cloud-sql-proxy <PROJECT_ID>:<REGION>:<INSTANCE_NAME> --port 5432
```

En otra terminal, desde la raíz del repo, define estos valores para el usuario de migraciones y la base vacía. Obtén la contraseña desde Secret Manager sin imprimirla ni guardarla en un archivo:

```powershell
$env:PGHOST = "127.0.0.1"
$env:PGPORT = "5432"
$env:PGUSER = "<DB_MIGRATOR_USER>"
$env:PGDATABASE = "dommia_prod"
$env:PGPASSWORD = (gcloud secrets versions access 1 --secret="<DB_MIGRATOR_PASSWORD_SECRET>" --project="<PROJECT_ID>")
psql -v ON_ERROR_STOP=1 -f docker/production-bootstrap.sql
psql -v ON_ERROR_STOP=1 -f docker/validate-schema.sql
Remove-Item Env:PGPASSWORD
```

El archivo usa inclusiones `psql` relativas a `docker/`; por eso debe ejecutarse con `psql -f` y con los SQL del repo disponibles en la máquina que corre el comando. No lo pegues en Cloud SQL Studio como SQL plano. El bootstrap aborta si encuentra tablas públicas de la aplicación o schemas `tenant_*`; para una base existente usa migraciones incrementales y luego la validación de esquema.

### Alta inicial del CRM

El bootstrap de esquema crea los planes base, pero no crea cuentas de operadores. Después de que `docker/validate-schema.sql` devuelva `PASS`, crea el primer `SUPER_ADMIN` con el comando de un solo uso. Mantén activo el Cloud SQL Auth Proxy y usa las mismas credenciales PostgreSQL controladas:

```powershell
$env:POSTGRES_HOST = "127.0.0.1"
$env:POSTGRES_PORT = "5432"
$env:POSTGRES_USER = "<DB_MIGRATOR_USER>"
$env:POSTGRES_DB = "dommia_prod"
$env:POSTGRES_PASSWORD = (gcloud secrets versions access 1 --secret="<DB_MIGRATOR_PASSWORD_SECRET>" --project="<PROJECT_ID>")
$env:DOMMIA_BOOTSTRAP_TARGET = "PRODUCTION"
corepack pnpm --filter @dommia/api bootstrap:first-admin
Remove-Item Env:POSTGRES_PASSWORD, Env:DOMMIA_BOOTSTRAP_TARGET
```

El comando pide confirmación escribiendo `CREATE FIRST SUPER_ADMIN IN PROD`; después solicita correo, nombre y apellido. Lee la contraseña dos veces sin mostrarla y la envía como parámetro para que PostgreSQL calcule el hash bcrypt. La contraseña no aparece en argumentos, consultas SQL ni logs de salida.

El comando comprueba que la base indicada ya tenga la migración 020 y aborta si existe cualquier fila `SUPER_ADMIN` o si el correo ya pertenece a otro usuario. Usa un bloqueo transaccional para evitar dos altas simultáneas. No actualiza cuentas existentes y no puede volver a ejecutarse después de crear al primer administrador. Si se pierde esa cuenta, la recuperación debe seguir un procedimiento administrativo separado, no repetir este bootstrap.

Cuando termine, inicia sesión en CRM con el correo y contraseña recién definidos. Revisa los planes base sembrados, configura MFA para la cuenta y desde CRM crea la primera comunidad. No ejecutes `docker/init-db/02-seed-demo-users.sql` en PROD.

## 6. Bloqueos que hay que cerrar antes del primer despliegue

- **Build de Cloud Run:** el repositorio no contiene Dockerfiles ni configuración Cloud Build por aplicación. Antes de desplegar, define una receta reproducible por workspace que compile dependencias compartidas y ejecute `pnpm start` en el contenedor. Los scripts de `start` de las cinco PWAs ya dejaron de fijar puertos locales; Next.js puede usar el `PORT` que inyecta Cloud Run.
- **Configuración del build frontend:** las cinco apps ya consumen `NEXT_PUBLIC_API_URL` desde sus resolvers por aplicación y los enlaces entre productos usan variables públicas dedicadas. Antes de PROD, configura las variables `NEXT_PUBLIC_*` de la matriz por aplicación y verifica que los bundles apunten a dominios HTTPS, nunca a `localhost`.
- **Bootstrap de PostgreSQL:** usa [`docker/production-bootstrap.sql`](../docker/production-bootstrap.sql) una sola vez y únicamente contra una base nueva y vacía. Aplica el baseline y las migraciones 003–027, registra las versiones aplicadas y elimina el tenant demo que crea el baseline común. No ejecutes `02-seed-demo-users.sql` en PROD.
- **Evidencia financiera:** crea y valida el bucket privado, IAM de la cuenta de servicio y `GCS_FINANCE_EVIDENCE_BUCKET` antes de habilitar la rendición mensual. DEV puede usar `.local/financial-evidence`; PROD no.
- **Migraciones:** el bootstrap es solo para una base nueva. En una base existente aplica únicamente migraciones pendientes, en orden y con `ON_ERROR_STOP`; la 027 cambia solo hosts propios antiguos `*.dommia.com` y conserva dominios externos de clientes. Los correos de usuarios/tenants no se cambian automáticamente. Después ejecuta [`docker/validate-schema.sql`](../docker/validate-schema.sql). No apliques DDL desde una request ni apuntes pruebas QA a PROD.
- **CORS y dominios:** los hosts oficiales están definidos arriba. Aún hay que crear DNS, certificados y ruteo wildcard, publicar los archivos `.well-known` de App/Universal Links, definir la allowlist exacta de orígenes fijos y registrar los dominios personalizados externos antes de desplegar. Un frontend construido con URL de API equivocada requiere una nueva imagen.
- **Secretos criptográficos:** define y respalda `MFA_ENCRYPTION_KEY` y `NOTIFICATIONS_ENCRYPTION_KEY` antes de guardar datos cifrados en PROD. Si se pierden o cambian sin migración, no se podrán descifrar los valores existentes.

## 7. Secuencia de despliegue

1. Cierra los bloqueos anteriores y revisa el plan vigente de MVP.
2. Provisiona proyecto, permisos, Artifact Registry, Cloud SQL, secretos, DNS/certificados/mappings para los hosts oficiales y alertas.
3. Ejecuta el bootstrap productivo limpio, valida el esquema y crea el primer `SUPER_ADMIN` con el comando de un solo uso. Después entra a CRM, revisa los planes y aprovisiona el primer tenant.
4. Construye las seis imágenes desde el monorepo. Para cada frontend, define sus `NEXT_PUBLIC_*` de PROD antes del build.
5. Despliega API primero. Comprueba `https://<API_DOMAIN>/api/v1/health`, login administrativo y conexión a Cloud SQL.
6. Despliega Portal, CRM, Communities, Resident y Guard. Comprueba desde cada navegador que sus requests usan el dominio API de PROD, no `localhost`.
7. Valida en staging primero: aislamiento entre tenants, MFA si está habilitado, alta/recuperación de residentes, cobros manuales, revisión de comprobantes, emisión/consumo/replay de QR y operación Guard.
8. Antes de abrir tráfico real, restaura un backup en un entorno separado y registra duración y resultado. Verifica RPO/RTO contra la meta aprobada.
9. Habilita tráfico gradualmente. Mantén una revisión anterior de cada servicio lista para rollback y documenta quién atiende alertas y solicitudes de soporte.

## 8. Lista de aceptación de PROD

- [ ] Ningún servicio PROD usa secretos, bases de datos o usuarios de DEV/demo.
- [ ] Se creó el primer `SUPER_ADMIN` con el comando de un solo uso; no se cargaron usuarios demo.
- [ ] La API no inicia si falta configuración PostgreSQL, `AUTH_TOKEN_SECRET`, `RESIDENT_APP_TOKEN_SECRET`, `MFA_ENCRYPTION_KEY`, `RESIDENT_APP_URL`, `CORS_ORIGINS` o `GCS_FINANCE_EVIDENCE_BUCKET`, ni si las llaves/orígenes tienen formato inválido.
- [ ] El bucket financiero bloquea acceso público; la cuenta de servicio API puede cargar/leer evidencias y un residente solo descarga copias redactadas autorizadas por el API.
- [ ] CORS permite los orígenes HTTPS fijos aprobados, los subdominios tenant oficiales y ningún dominio externo no registrado.
- [ ] Todos los hosts oficiales, wildcard de tenants y archivos `.well-known` tienen DNS/TLS verificado; Android App Links e iOS Universal Links pasan una prueba en dispositivo.
- [ ] Cloud Run usa la cuenta de servicio correcta y PostgreSQL no tiene exposición pública innecesaria.
- [ ] Las cinco PWAs llaman a `NEXT_PUBLIC_API_URL` de PROD y escuchan en el `PORT` de Cloud Run.
- [ ] No se ejecutaron semillas demo en la base productiva.
- [ ] Migraciones y bootstrap productivo tienen evidencia de revisión y ejecución.
- [ ] Backups y PITR están activos y se completó una restauración de prueba.
- [ ] Smoke test de los flujos del MVP termina sin errores y con aislamiento tenant verificado.
- [ ] Logging, alertas, dominios HTTPS, soporte y procedimiento de rollback están operativos.

## 9. Referencias del repositorio

- [Plan de Desarrollo Maestro por Fases](Planes/Plan%20de%20Desarrollo%20Maestro%20por%20Fases.md): alcance vigente y criterios de MVP.
- [Conexión PostgreSQL y Multi-Tenancy](Arquitectura/Conexion%20PostgreSQL%20y%20Multi-Tenancy.md): pool, `search_path`, transacciones y migraciones.
- [Protocolo de Seguridad](Arquitectura/Protocolo%20de%20Seguridad%20y%20Proteccion%20de%20Propiedad%20Intelectual.md): MFA y protección de secretos.
- [Notificaciones Premium](Arquitectura/Notificaciones%20Premium%20SMTP%20WhatsApp.md): entitlement y cifrado de configuración de canales.
- [Guía de Testing](../Testing/README.md): servicios locales y pruebas pendientes de staging/dispositivos.
