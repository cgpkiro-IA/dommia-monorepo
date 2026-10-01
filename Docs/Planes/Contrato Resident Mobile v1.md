# Contrato Resident Mobile v1

**Estado:** Contrato normativo comun para Android e iOS, verificado contra `apps/api` y E2E el 30 de septiembre de 2026 (15/15).
**Alcance:** Clientes nativos Android e iOS de DOMMIA Resident.
**Fuente normativa para clientes:** este documento. La implementacion se verifica contra `apps/api/src/modules/auth`, `apps/api/src/modules/access`, `apps/api/src/modules/notices` y `apps/api/src/modules/finance`; las guias Android/iOS no redefinen rutas, DTOs, permisos ni envelopes.
**Prefijo HTTP:** `/api/v1`.

Este documento define un unico contrato para Android e iOS. No se deben crear rutas separadas por plataforma. `clientType` identifica la plataforma de la sesion, pero no concede permisos.

## 1. Reglas de compatibilidad

- Las rutas moviles usan `/auth/app/resident/*`.
- `clientType` solo acepta `ANDROID` o `IOS`.
- La PWA mantiene las rutas `/auth/resident/*` durante la transicion. Los nuevos logins de esas rutas emiten JWT estandar firmado con `AUTH_TOKEN_SECRET`; los tokens HMAC de dos segmentos ya emitidos se aceptan solo como compatibilidad temporal hasta su expiracion.
- El servidor es la autoridad para identidad, tenant, vivienda, permisos y estado de sesion.
- El cliente trata el JWT como opaco; no toma decisiones de negocio leyendo sus claims.
- El cliente no envia `propertyId` para decidir su propia vivienda en operaciones moviles.
- No se crean usuarios desde Android o iOS.
- El `tenantSlug` es contexto de comunidad, no un secreto.
- El servidor valida firma HS256, issuer, audience, `clientType`, expiracion y sesion revocable; el cliente trata el JWT como opaco.

## 2. Login movil

### Request

`POST /api/v1/auth/app/resident/login`

```json
{
  "identifier": "correo@dominio.com",
  "password": "********",
  "tenantSlug": "mi-comunidad",
  "clientType": "IOS",
  "deviceId": "uuid-del-dispositivo",
  "deviceName": "Dispositivo del residente"
}
```

Reglas del request:

- `identifier`: correo o telefono registrado, de 1 a 150 caracteres.
- `password`: de 1 a 256 caracteres.
- `tenantSlug`: de 1 a 150 caracteres.
- `clientType`: `ANDROID` o `IOS`.
- `deviceId`: UUID opcional, recomendado para ambos clientes.
- `deviceName`: opcional, maximo 120 caracteres.

### Login exitoso

```json
{
  "success": true,
  "data": {
    "accessToken": "jwt",
    "refreshToken": "opaque-token",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "refreshExpiresAt": "2026-10-29T12:00:00.000Z",
    "resident": {
      "id": "uuid",
      "property_id": "uuid",
      "first_name": "Ana",
      "last_name": "Rivera",
      "email": "correo@dominio.com",
      "phone": "+52...",
      "role": "OWNER",
      "is_primary": true,
      "is_active": true
    },
    "tenantSlug": "mi-comunidad",
    "clientType": "IOS",
    "deviceId": "uuid-del-dispositivo",
    "deviceName": "Dispositivo del residente"
  }
}
```

El API no devuelve en este contrato `user`, `tenant` ni `refreshExpiresIn`.

El access token es JWT de tres segmentos con header `{ alg: "HS256", typ: "JWT", kid: "resident-hs256-v1" }`. Sus claims de autorización los valida exclusivamente el servidor: `iss=dommia-api`, `aud=dommia-resident-api`, `sub`, `role=RESIDENT`, `tenantSlug`, `propertyId`, `sid`, `jti`, `clientType`, `iat` y `exp` (NumericDate en segundos). `RESIDENT_APP_TOKEN_SECRET` es secreto exclusivo del API, de al menos 32 caracteres; nunca se distribuye en APK/IPA.

### Cambio de contraseña requerido

Si la cuenta tiene contraseña temporal, el login responde exitosamente sin emitir tokens:

```json
{
  "success": true,
  "data": {
    "passwordChangeRequired": true,
    "tenantSlug": "mi-comunidad"
  }
}
```

El cliente debe completar el cambio y ejecutar login nuevamente.

## 3. Cambio de contraseña

`POST /api/v1/auth/app/resident/change-password`

```json
{
  "identifier": "correo@dominio.com",
  "tenantSlug": "mi-comunidad",
  "currentPassword": "********",
  "newPassword": "NuevaClaveSegura2026!"
}
```

La contraseña nueva debe tener al menos 10 caracteres, una mayuscula, una minuscula, un numero y un simbolo.

Este endpoint no requiere Bearer token porque autentica con identificador, tenant y contraseña actual. Al completarlo, el API revoca todas las sesiones moviles activas y responde con `data.revokedSessions`; la app debe borrar ambos tokens y volver a login.

## 4. Refresh y sesion

### Refresh

`POST /api/v1/auth/app/resident/refresh`

```json
{
  "refreshToken": "opaque-token"
}
```

Respuesta exitosa: mismo modelo de tokens que login, dentro de `data`. El API devuelve un nuevo refresh token y `refreshExpiresAt`.

Politica implementada:

- Access token: 15 minutos.
- Refresh por inactividad: 30 dias.
- Limite absoluto de sesion: 90 dias.
- Rotacion obligatoria en cada uso.
- Reutilizar un refresh token anterior revoca la familia de sesion y audita `APP_REFRESH_REUSE_DETECTED`.

Android e iOS deben serializar el refresh para que exista una sola operacion concurrente por sesion. Si falla, deben borrar la sesion local y volver al login.

### Endpoints de sesion

| Operacion | Metodo y ruta | Resultado |
| --- | --- | --- |
| Perfil | `GET /api/v1/auth/app/resident/me` | `{ success, data }` |
| Logout | `POST /api/v1/auth/app/resident/logout` | `{ success: true }` |
| Listar sesiones | `GET /api/v1/auth/app/resident/sessions` | `{ success, data: [...] }` |
| Revocar sesion | `DELETE /api/v1/auth/app/resident/sessions/:id` | `{ success: true }` |

Todas requieren `Authorization: Bearer <accessToken>` y `ResidentAppAuthGuard`.

### Recuperacion de contraseña

| Operacion | Metodo y ruta | Autenticacion |
| --- | --- | --- |
| Solicitar recuperacion | `POST /api/v1/auth/app/resident/password-recovery` | Publica |
| Restablecer contraseña | `POST /api/v1/auth/app/resident/password-reset` | Token de recuperacion en body |

La solicitud recibe `identifier` y `tenantSlug`. La respuesta es generica para no revelar si la cuenta existe. En DEV puede incluir `data.resetToken` para pruebas locales; en produccion el token no se devuelve y se entrega por el canal configurado.

El reset recibe `token` y `newPassword`, invalida el token de un solo uso y revoca las sesiones moviles existentes. Android e iOS deben abrir el enlace mediante su App Link/Universal Link sin modificar el contrato HTTP.

### Contrato de enlaces

Los enlaces enviados por el API usan la URL base `RESIDENT_APP_URL` y estos paths:

```text
https://<RESIDENT_APP_URL>/activate-resident?token=<token>&tenant=<tenantSlug>
https://<RESIDENT_APP_URL>/reset-resident?token=<token>&tenant=<tenantSlug>
```

Reglas para Android e iOS:

- `token` y `tenant` se leen como query parameters y se procesan una sola vez.
- La app no debe registrar, analytics, cachear ni compartir el token.
- `tenant` solo aporta contexto visual; el API valida el token y el tenant.
- Si la app no está instalada, el mismo enlace debe conservar fallback web.
- Android usa App Links con `assetlinks.json`.
- iOS usará Universal Links con `apple-app-site-association` cuando exista el workspace nativo y se defina el Team ID/bundle ID de producción.
- La app debe rechazar enlaces sin token, con token vacío o con query duplicada ambigua.

## 5. Recursos moviles

Todas las rutas de recursos siguientes requieren una sesion Resident valida y rol `RESIDENT`; el API deriva tenant y vivienda desde la sesion. Acceso, invitaciones, sesiones/dispositivos y finanzas requieren JWT nativo mediante `ResidentAppAuthGuard`. Avisos usa `ResidentAuthGuard` para aceptar tambien sesiones Resident web durante la transicion. Login, cambio de contraseña, recuperacion, reset y refresh son publicas y se validan con credenciales, token de recuperacion o refresh token segun corresponda.

| Operacion | Metodo y ruta |
| --- | --- |
| Credencial de acceso | `GET /api/v1/auth/app/resident/access-credential` |
| Servicios activos | `GET /api/v1/auth/app/resident/access-credential/active-services` |
| Entregas activas | `GET /api/v1/auth/app/resident/access-credential/active-deliveries` |
| Avisos | `GET /api/v1/auth/app/resident/notices` |
| Listar invitaciones | `GET /api/v1/auth/app/resident/invitations` |
| Crear invitacion | `POST /api/v1/auth/app/resident/invitations` |
| Revocar invitacion | `DELETE /api/v1/auth/app/resident/invitations/:id` |
| Estado financiero | `GET /api/v1/auth/app/resident/finance/status` |
| Campanas financieras | `GET /api/v1/auth/app/resident/finance/campaigns` |
| Cotizacion | `POST /api/v1/auth/app/resident/finance/campaigns/:campaignId/quote` |
| Envio SPEI | `POST /api/v1/auth/app/resident/finance/spei-submissions` |
| Envio de pago de campana | `POST /api/v1/auth/app/resident/finance/campaigns/:campaignId/submissions` |
| Upload de comprobante DEV | `POST /api/v1/auth/app/resident/finance/receipts` |
| Registrar push token | `POST /api/v1/auth/app/resident/devices/push-token` |
| Revocar push token | `DELETE /api/v1/auth/app/resident/devices/push-token/:deviceId` |
| Listar rendiciones publicadas | `GET /api/v1/auth/app/resident/finance/monthly-reports` |
| Consultar rendición | `GET /api/v1/auth/app/resident/finance/monthly-reports/:id` |
| Marcar revisión opcional | `POST /api/v1/auth/app/resident/finance/monthly-reports/:id/review` |
| Descargar evidencia redactada | `GET /api/v1/auth/app/resident/finance/monthly-reports/evidence/:evidenceId/content` |

### Payloads de recursos móviles

Los DTOs del API son la lista allowlist. No envíes propiedades extras; el `ValidationPipe` las rechaza. En ningún body nativo se acepta `tenantSlug` o `propertyId` para cambiar el contexto de la sesión.

| Request | Campos requeridos y restricciones |
| --- | --- |
| Crear invitación | `visitorName` (2–150), `passType` (`SINGLE_USE`, `TEMPORARY`, `FREQUENT`), `validDays` (entero 1–30); `notes?` (máx. 300). |
| Cotizar campaña | Sin body; el servidor usa la vivienda de los claims. |
| Enviar SPEI | `amount` (número >0), `reference` (1–128), `receiptUrl` (1–5,000,000); `chargeId?`, `payerName?` (máx. 120), `notes?` (máx. 500). El backend agrega `propertyId` de la sesión. |
| Enviar pago de campaña | `amount` (>0), `reference` (1–128); `receiptUrl?` (máx. 5,000,000), `payerName?` (máx. 120). El backend agrega `propertyId` de la sesión. |
| Subir recibo DEV | `contentBase64`, `contentType` (`application/pdf`, `image/jpeg`, `image/png`). Máximo binario 3.75 MB. |
| Registrar push token | `deviceId` UUID, `token` (20–4096). El servidor obtiene plataforma de `clientType`. |

Las rutas de recursos Resident Mobile normalizan la respuesta como `{ success, message?, data }`. Los errores HTTP procesados por `ResidentAppExceptionFilter` responden `{ success: false, message, data: null, statusCode, error }`. Cada `data` conserva el modelo propio de su endpoint; no reutilices modelos de rutas PWA legacy.

Las rendiciones mensuales son de solo lectura para Resident. La marca de revisión es opcional, idempotente y no condiciona el acceso. El snapshot publicado incluye agregados de ingresos/egresos y evidencias expresamente redactadas; no expone objetos `ADMIN_ONLY` ni datos de otro tenant.

### Push multiplataforma

El request de `push-token` usa el mismo cuerpo para Android e iOS:

```json
{
  "deviceId": "uuid-del-dispositivo",
  "token": "token-del-proveedor"
}
```

La plataforma se obtiene de `clientType` en el JWT movil; el cliente no puede declararla en el body. El proveedor se interpreta segun esa sesion: FCM para Android y APNs para iOS.

`POST/DELETE /api/v1/auth/app/resident/devices/fcm-token` se conserva como alias compatible para clientes Android existentes. Las nuevas integraciones deben usar `push-token`.

El request exige `deviceId` UUID y `token` de 20 a 4096 caracteres. La plataforma se deriva de `clientType` en la sesion, nunca del body.

### Comprobantes en DEV

`POST /api/v1/auth/app/resident/finance/receipts` recibe:

```json
{
  "contentBase64": "JVBERi0x...",
  "contentType": "application/pdf"
}
```

Tipos permitidos en DEV: `application/pdf`, `image/jpeg` e `image/png`. El API valida la firma binaria, limita el archivo a 3.75 MB y lo guarda localmente fuera de PostgreSQL. La respuesta devuelve una referencia `local://resident-receipts/...` con `storage=LOCAL_DEV`.

Esta referencia solo sirve para pruebas locales. No debe enviarse a produccion ni interpretarse como URL publica. Android aun no integra el upload; iOS solo puede usarlo en DEV. El almacenamiento productivo requiere un adaptador privado aprobado. Ninguna app debe presentar pagos con `local://` como comprobantes listos para PROD.

## 6. Errores y reintentos

- `400`: request invalido; no reintentar automaticamente.
- `401`: access token invalido o expirado; intentar refresh una sola vez.
- `403`: permiso o modulo no habilitado; no reintentar.
- `404`: recurso inexistente o no perteneciente al residente.
- `409`: conflicto; mostrar accion de resolucion.
- `429`: rate limit; esperar y permitir reintento manual.
- `5xx`: error del servicio; no repetir automaticamente operaciones no idempotentes.

No se deben registrar passwords, access tokens, refresh tokens, QR, comprobantes ni PII innecesaria.

## 7. Estado y bloqueos antes de release

Backend y las rutas de este contrato pasaron E2E local 15/15 el 2026-09-30. Ya estan implementados y probados: guard Resident movil, aislamiento tenant/vivienda, cambio/reset de contraseña con revocacion de sesiones moviles, rotacion/replay de refresh, sesiones por dispositivo, avisos, invitaciones, acceso y lectura/cotizacion financiera.

Pendientes que bloquean el uso productivo de las funciones correspondientes:

1. Almacenamiento privado de comprobantes. `POST /finance/receipts` actualmente guarda solo en DEV y devuelve `local://`; no usarlo en PROD.
2. Idempotencia persistida para pagos/envios. No existe `Idempotency-Key` ni garantia atomica; los clientes no reintentan automaticamente esos POST.
3. Rate limiting distribuido antes de escalar Cloud Run a varias instancias; el rate limiter Resident actual es en memoria por proceso.
4. Validacion de staging, proveedores push FCM/APNs y enlaces App Links/Universal Links en dominios y cuentas de firma productivos.
5. Android implementa estado/campañas/cotizacion, pero aun no envio de pago/upload. iOS implementa upload local DEV, pero no envio de pago.

## 8. Limite de compatibilidad de esta version

Este contrato limita los cambios propios del cliente nativo a `/api/v1/auth/app/*` y sus recursos protegidos. La compatibilidad legacy de la PWA se conserva con los cambios transversales de autorización documentados en el Plan Maestro 1.22.0: algunas rutas `tenants/*` ahora requieren Bearer y devuelven 401/403 a clientes no autorizados, aunque sus modelos de éxito de negocio no cambien.

No se permite en esta fase:

- Ejecutar DDL desde handlers HTTP, guards o requests.
- Cambiar el esquema o los datos consumidos por la PWA y los sitios administrativos.
- Cambiar campos de éxito de `/api/v1/auth/resident/*`, `/api/v1/auth/*` administrativo o rutas `tenants/*` existentes sin versionado y prueba de consumidores.
- Cambiar servicios compartidos de forma que alteren la respuesta de clientes legacy.

La implementacion debe usar adaptadores, mappers o servicios especificos de app para transformar respuestas sin afectar los contratos existentes. Puede leer y actualizar registros existentes cuando la operacion ya forme parte del contrato movil actual, por ejemplo revocar una sesion movil existente. Esta version consume las migraciones 021 (`resident_app_refresh_sessions`), 022 (`resident_push_tokens`) y 023 (`tenant_monthly_financial_reports`); cualquier nueva migracion requiere revision, bootstrap y cobertura E2E.

La compatibilidad móvil se prueba contra `/api/v1/auth/app/*` y las rutas compartidas explícitamente indicadas aquí; no se debe ampliar o cambiar el contrato PWA/admin por conveniencia del cliente nativo.

## 9. Rate limiting por ambiente

El contrato usa una abstraccion de rate limiter. DEV ejecuta `InMemoryResidentRateLimiter`, sin dependencia externa. Produccion debe inyectar un backend distribuido compatible antes de ejecutar multiples instancias; la implementacion en memoria no debe considerarse suficiente para Cloud Run escalado.
