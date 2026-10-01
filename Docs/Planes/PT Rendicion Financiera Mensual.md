# PT: Rendición financiera mensual

**Estado:** Implementado en DEV el 30 de septiembre de 2026. API E2E 16/16.
**Producto:** Dommia Finance / Communities / Resident.
**Migración:** `023_tenant_monthly_financial_reports.sql`.
**Almacenamiento:** Google Cloud Storage privado en producción; filesystem local solo en DEV.

## 1. Objetivo normativo

Cada administración debe preparar y publicar una rendición mensual de ingresos y egresos de su fraccionamiento. La publicación es responsabilidad del administrador; la consulta y la marca de revisión son opcionales para cada residente.

La rendición es un reporte comunitario en base caja y no sustituye el estado de cuenta individual de una vivienda. Los cargos emitidos no son ingresos hasta que exista pago aprobado. Los pagos pendientes se presentan como actividad pendiente, no como ingreso.

## 2. Autorización y aislamiento

- Solo `TENANT_ADMIN` cuyo `tenantSlug` coincide exactamente con `:slug` puede crear gastos, subir evidencia, aprobar gastos y publicar.
- `SUPER_ADMIN`, `OPERATOR`, `GUARD` y otros roles no gestionan rendiciones mediante estas rutas.
- Resident solo consulta reportes `PUBLISHED` del tenant de su sesión y marca revisión opcional.
- Toda consulta usa `DatabaseService.queryTenant()`; las tablas viven en el schema `tenant_<slug>`.
- `financial_monthly_report_settings` fija `reporting_start_month` por tenant: existentes desde el mes de rollout y futuros desde su aprovisionamiento. La lista administrativa muestra periodos `MISSING` y `IN_PROGRESS`; no se fija una fecha límite diaria en esta versión.
- El cliente nunca envía una ruta GCS ni decide el prefijo tenant. El API genera `tenants/<tenantSlug>/financial-evidence/<uuid>.<ext>` después de autorizar.
- Evidencia `ADMIN_ONLY` nunca se expone a Resident. Evidencia `RESIDENTS` exige `is_redacted=true`, gasto aprobado y reporte publicado.

## 3. Fuente de ingresos y egresos

### Ingresos derivados, sin captura duplicada

El cierre agrega:

1. `financial_payments` con estado `APPROVED` y `paid_at` dentro del periodo.
2. `annual_payment_commitments` con estado `APPROVED` y `reviewed_at` dentro del periodo.

Clasificación de ingresos regulares:

- `MAINTENANCE_FEE`: cuota ordinaria fija o variable.
- `EXTRAORDINARY_FEE`: cuota extraordinaria.
- `ADVANCE_MAINTENANCE`: pago aprobado sin cargo asociado.
- `ANNUAL_ADVANCE`: compromiso anual aprobado, separado para no duplicarlo con pagos regulares.

El snapshot agrupa cada fuente por fecha, categoría y método de pago; no incluye identificadores, nombres ni datos de vivienda.

Los SPEI `PENDING_APPROVAL`, cargos emitidos y saldo pendiente se incluyen como actividad informativa, no en ingreso cobrado.

### Egresos capturados

Categorías cerradas: vigilancia/nómina, administración, limpieza, jardinería, portón/accesos, servicios, reparaciones, insumos, seguros, comisiones bancarias y otros.

Cada gasto se asocia a una revisión concreta (`report_id`) y a un día dentro de su periodo. Empieza en `DRAFT`; para aprobarlo necesita evidencia o una justificación de excepción. Solo gastos `APPROVED` entran al cierre. El estado bancario se adjunta a la rendición, no se contabiliza como egreso.

## 4. Cierre y conciliación

Cálculo:

```text
saldo inicial = banco inicial + efectivo inicial
saldo final calculado = saldo inicial + ingresos aprobados - egresos aprobados
diferencia = banco final reportado + efectivo final reportado - saldo final calculado
```

Si la diferencia absoluta supera un centavo, `publicationNotes` es obligatoria. Publicar congela un snapshot JSON versionado; el registro deja de aceptar gastos. Una corrección requiere una nueva revisión que referencia el reporte anterior mediante `supersedes_report_id`.

No puede existir más de un borrador por mes. Puede haber múltiples revisiones publicadas del mismo periodo.

## 5. Tablas tenant-scoped

| Tabla | Propósito |
| --- | --- |
| `financial_monthly_report_settings` | Mes inicial desde el que el tenant debe publicar rendiciones mensuales. |
| `financial_expenses` | Gasto asociado a una revisión, categoría, proveedor, fecha, método, estado, responsables y excepción de evidencia. |
| `financial_monthly_reports` | Periodo, revisión, saldos, conciliación, snapshot inmutable y publicación. |
| `financial_report_evidence` | Metadata/hashes de objetos privados asociados a gasto o documentación general de una rendición. |
| `financial_monthly_report_reviews` | Marca opcional e idempotente de revisión por residente. |

PostgreSQL guarda metadata y hash SHA-256; el archivo no se guarda en la base.

## 6. Evidencia y Google Cloud Storage

- Variable: `GCS_FINANCE_EVIDENCE_BUCKET`.
- Cloud Run usa Application Default Credentials; no se versiona JSON de service account.
- Bucket con Public Access Prevention y Uniform Bucket-Level Access.
- La cuenta de servicio del API recibe el mínimo permiso de lectura/escritura/borrado en ese bucket; usuarios y frontends no reciben IAM.
- El API valida Base64, firma binaria y máximo 3.75 MB. Tipos: PDF, JPEG y PNG.
- Descargas pasan por el API y requieren autorización; respuesta `Cache-Control: private, no-store`.
- Para compartir con residentes, el administrador carga una copia redactada. Estados bancarios, nómina y documentos con PII permanecen `ADMIN_ONLY` salvo redacción explícita.
- DEV sin bucket usa `.local/financial-evidence`; producción falla al arrancar si falta el bucket.

## 7. Rutas

### Administración (`TENANT_ADMIN` exacto)

```text
GET    /api/v1/tenants/:slug/finance/monthly-reports
POST   /api/v1/tenants/:slug/finance/monthly-reports
GET    /api/v1/tenants/:slug/finance/monthly-reports/:id
POST   /api/v1/tenants/:slug/finance/monthly-reports/:id/evidence
POST   /api/v1/tenants/:slug/finance/monthly-reports/:id/expenses
POST   /api/v1/tenants/:slug/finance/monthly-reports/expenses/:expenseId/evidence
POST   /api/v1/tenants/:slug/finance/monthly-reports/expenses/:expenseId/approve
POST   /api/v1/tenants/:slug/finance/monthly-reports/:id/publish
GET    /api/v1/tenants/:slug/finance/monthly-reports/evidence/:evidenceId/content
```

### Resident PWA

```text
GET  /api/v1/auth/resident/finance/monthly-reports
GET  /api/v1/auth/resident/finance/monthly-reports/:id
POST /api/v1/auth/resident/finance/monthly-reports/:id/review
GET  /api/v1/auth/resident/finance/monthly-reports/evidence/:evidenceId/content
```

### Android/iOS

Las mismas operaciones de solo lectura bajo `/api/v1/auth/app/resident/finance/monthly-reports` con `ResidentAppAuthGuard`.

## 8. UI implementada

- Communities: pestaña `Rendición Mensual` en Finanzas para periodo, gastos, evidencia, aprobación, conciliación y publicación.
- Resident PWA: resumen publicado, saldos inicial/final, ingresos agrupados por fecha/categoría/método, egresos, pendientes separados, evidencias redactadas y marca opcional de revisión.
- Android/iOS: resumen publicado, ingresos/egresos, metadatos y descarga autenticada de evidencia; revisión opcional. Sin edición ni publicación Resident.

## 9. Pruebas y límites

E2E valida: 401 anónimo, 403 Guard, escritura exclusiva `TENANT_ADMIN`, evidencia pública solo redactada, original oculto a Resident, aprobación con evidencia/excepción, publicación inmutable, lista de periodos requeridos, lectura Resident, revisión idempotente e ingresos del mismo día separados por método de pago. Último resultado DEV: suite API completa 16/16.

El cierre no constituye contabilidad fiscal o devengada. Antes de PROD se requiere revisar categorías, retención documental y política de redacción con administración/asesoría contable y privacidad.
