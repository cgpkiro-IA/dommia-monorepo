# DOMMIA Resident Android

Cliente nativo Android de DOMMIA Resident. El contrato HTTP compartido con iOS y el backend está en [Contrato Resident Mobile v1](../../Docs/Planes/Contrato%20Resident%20Mobile%20v1.md); ese documento es la fuente normativa para rutas, DTOs, auth, errores y aislamiento.

## Integración actual

- Login nativo en `POST /api/v1/auth/app/resident/login`; access JWT de 15 minutos y refresh opaco rotatorio.
- Refresh concurrente coordinado, perfil y logout mediante rutas `auth/app/resident/*`.
- Persistencia actual de access token, refresh token y perfil en `EncryptedSharedPreferences` con `MasterKey` respaldada por Android Keystore.
- Perfil, QR, avisos, invitaciones, servicios/entregas activas, estado/campañas financieras y cotización usan recursos autenticados del contrato móvil.
- Rendiciones financieras publicadas se consultan desde `/auth/app/resident/finance/monthly-reports`; la revisión es opcional y Resident no puede editar/publicar.
- Push registra/revoca `fcm-token`, alias compatible del endpoint genérico `push-token`.

## Límites actuales

- Android no implementa envío SPEI/pago anual ni upload de comprobantes.
- No consumir `local://` como referencia de pago: el storage de recibos del API es solo DEV. Storage privado e idempotencia financiera siguen siendo gates de PROD.
- Activación inicial conserva `POST /api/v1/auth/resident/activate`; recuperación/reset móvil usa las rutas `auth/app/resident/*`.
- Las URLs API se configuran por flavor. No incluir secretos del backend en el APK, `BuildConfig`, recursos ni configuración remota.
