# Contrato Resident Mobile v1

**Estado:** Contrato comun para Android e iOS, corregido contra `apps/api` el 29 de septiembre de 2026.
**Alcance:** Clientes nativos Android e iOS de DOMMIA Resident.
**Fuente de verdad de implementacion:** `apps/api/src/modules/auth`, `apps/api/src/modules/access`, `apps/api/src/modules/notices` y `apps/api/src/modules/finance`.
**Prefijo HTTP:** `/api/v1`.

Este documento define un unico contrato para Android e iOS. No se deben crear rutas separadas por plataforma. `clientType` identifica la plataforma de la sesion, pero no concede permisos.

## 1. Reglas de compatibilidad

- Las rutas moviles usan `/auth/app/resident/*`.
- `clientType` solo acepta `ANDROID` o `IOS`.
- La PWA mantiene temporalmente las rutas legacy `/auth/resident/*`.
- El servidor es la autoridad para identidad, tenant, vivienda, permisos y estado de sesion.
- El cliente trata el JWT como opaco; no toma decisiones de negocio leyendo sus claims.
- El cliente no envia `propertyId` para decidir su propia vivienda en operaciones moviles.
- No se crean usuarios desde Android o iOS.
- El `tenantSlug` es contexto de comunidad, no un secreto.

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

Este endpoint actualmente no requiere Bearer token. La politica de revocacion de sesiones existentes despues del cambio debe cerrarse antes de produccion; el comportamiento actual actualiza la contraseña y registra auditoria, pero no revoca todas las sesiones.

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

Todas las rutas siguientes requieren JWT movil y derivan tenant y vivienda desde la sesion:

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

Las respuestas de finanzas no estan uniformadas en todos los servicios actuales. Los clientes deben usar modelos por endpoint hasta que el API publique envelopes consistentes.

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

### Comprobantes en DEV

`POST /api/v1/auth/app/resident/finance/receipts` recibe:

```json
{
  "contentBase64": "JVBERi0x...",
  "contentType": "application/pdf"
}
```

Tipos permitidos en DEV: `application/pdf`, `image/jpeg` e `image/png`. El API valida la firma binaria, limita el archivo a 3.75 MB y lo guarda localmente fuera de PostgreSQL. La respuesta devuelve una referencia `local://resident-receipts/...` con `storage=LOCAL_DEV`.

Esta referencia solo sirve para pruebas locales. No debe enviarse a producción ni interpretarse como una URL pública. El almacenamiento productivo requiere un adaptador privado posterior; el contrato de pagos mantiene `receiptUrl` para recibir la referencia aprobada por el backend.

## 6. Errores y reintentos

- `400`: request invalido; no reintentar automaticamente.
- `401`: access token invalido o expirado; intentar refresh una sola vez.
- `403`: permiso o modulo no habilitado; no reintentar.
- `404`: recurso inexistente o no perteneciente al residente.
- `409`: conflicto; mostrar accion de resolucion.
- `429`: rate limit; esperar y permitir reintento manual.
- `5xx`: error del servicio; no repetir automaticamente operaciones no idempotentes.

No se deben registrar passwords, access tokens, refresh tokens, QR, comprobantes ni PII innecesaria.

## 7. Contratos pendientes antes de release

Estos puntos son multiplataforma y no deben resolverse creando rutas exclusivas de Android o iOS:

1. Revocar sesiones existentes al cambiar contraseña.
2. Uniformar envelopes de login, refresh, perfil y finanzas.
3. Definir idempotencia para pagos, comprobantes e invitaciones. Sin cambios de esquema no se puede garantizar idempotencia atomica; mientras no exista almacenamiento aprobado, las apps no deben reintentar automaticamente estas operaciones.
4. Definir upload privado de comprobantes y el significado de `receiptUrl`.
5. Validar integracion de proveedores FCM/APNs y completar pruebas de entrega; el contrato generico `push-token` ya esta disponible y `fcm-token` permanece como alias.
6. Validar App Links/Universal Links y entrega por email/WhatsApp para las rutas de recuperacion movil, ya disponibles. El contrato de URL queda fijado en esta version.
7. Probar refresh concurrente y rate limiting distribuido.

## 8. Limite de compatibilidad de esta version

Las implementaciones de este contrato solo pueden modificar las salidas y el comportamiento de las rutas `/api/v1/auth/app/*` y sus recursos moviles protegidos bajo `/api/v1/auth/app/resident/*`.

No se permite en esta fase:

- Crear migraciones, columnas, indices o tablas nuevas.
- Cambiar el esquema o los datos consumidos por la PWA y los sitios administrativos.
- Cambiar respuestas de `/api/v1/auth/resident/*`, `/api/v1/auth/*` administrativo o rutas `tenants/*` existentes.
- Cambiar servicios compartidos de forma que alteren la respuesta de clientes legacy.

La implementacion debe usar adaptadores, mappers o servicios especificos de app para transformar respuestas sin afectar los contratos existentes. Puede leer y actualizar registros existentes cuando la operacion ya forme parte del contrato movil actual, por ejemplo revocar una sesion movil existente.

La finalizacion de estos puntos cambia solamente las rutas `/api/v1/auth/app/*` y sus pruebas. Cualquier requisito que necesite persistencia nueva, como idempotencia atomica o un registro generico de tokens push, debe quedar documentado como bloqueo y no implementarse mediante cambios de base de datos en esta fase.

## 9. Rate limiting por ambiente

El contrato usa una abstraccion de rate limiter. DEV ejecuta `InMemoryResidentRateLimiter`, sin dependencia externa. Produccion debe inyectar un backend distribuido compatible antes de ejecutar multiples instancias; la implementacion en memoria no debe considerarse suficiente para Cloud Run escalado.
