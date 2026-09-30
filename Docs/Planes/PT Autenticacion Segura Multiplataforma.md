# PT: autenticación segura multiplataforma

**Prioridad:** Gate de producción para publicar Resident nativo.
**Alcance:** DOMMIA Resident Web, Android e iOS. CRM, Communities y Guard conservan sus identidades y permisos propios.
**Propietario técnico:** Backend / API.
**Estado actual:** Seguridad y rutas Resident implementadas; API E2E local 15/15 el 2026-09-30. Guards, tenant/vivienda, revocación por contraseña, rotación/replay y recursos de avisos/finanzas están probados. Producción/staging requiere secretos, migraciones 020–022, storage privado de comprobantes e idempotencia financiera. OAuth/OIDC no forma parte del MVP.

## 1. Objetivo

Definir un contrato de sesión único y seguro para los clientes Resident, separar sus rutas de autenticación de las cuentas administrativas y mantener el backend como fuente de identidad, permisos, avisos y datos.

Android e iOS deben compartir el mismo contrato Resident. La PWA puede migrar por etapas. No se crearán bases de datos ni servicios de autenticación duplicados por plataforma.

## 2. Decisión implementada

El dominio de autenticación vive en `AuthModule` y `apps/api`. Es un módulo del monolito NestJS existente, no un microservicio ni un proveedor OAuth nuevo.

Las rutas móviles Resident implementadas bajo el espacio independiente son:

| Operación | Ruta actual |
| --- | --- |
| Login Resident para app | `POST /api/v1/auth/app/resident/login` |
| Cambio inicial de contraseña | `POST /api/v1/auth/app/resident/change-password` |
| Renovar sesión | `POST /api/v1/auth/app/resident/refresh` |
| Logout del dispositivo actual | `POST /api/v1/auth/app/resident/logout` |
| Consultar perfil móvil | `GET /api/v1/auth/app/resident/me` |
| Listar sesiones del residente | `GET /api/v1/auth/app/resident/sessions` |
| Revocar una sesión | `DELETE /api/v1/auth/app/resident/sessions/:id` |

Android e iOS usan las mismas rutas. No agregues `/android` ni `/ios` al contrato. El backend puede guardar `clientPlatform` y `deviceName` como metadatos de sesión, pero esos valores no otorgan permisos.

Mantén `/api/v1/auth/resident/*` durante la transición PWA. Sus nuevos logins emiten JWT HS256 de 24 horas firmado con `AUTH_TOKEN_SECRET`; los HMAC de dos segmentos emitidos previamente se aceptan solo hasta expirar. Android/iOS usan `/auth/app/resident/*`, JWT HS256 de 15 minutos firmado con `RESIDENT_APP_TOKEN_SECRET` y refresh opaco rotatorio. `ResidentAppAuthGuard` valida issuer/audience, rol, tipo de cliente, propiedad y sesión revocable. Los endpoints compartidos compatibles usan `ResidentAuthGuard` y aceptan sesiones Resident válidas.

Las rutas `/api/v1/auth/login` y sus permisos administrativos no se mezclan con Resident. CRM, Communities y Guard no deben aceptar tokens de audiencia Resident.

## 3. Tokens y sesiones

Las apps nativas usan JWT estándar para access tokens. El cliente lo trata como opaco y nunca contiene una clave para verificar firmas.

El identificador `kid` pertenece al header JWT, no a los claims:

```json
{"alg":"HS256","typ":"JWT","kid":"resident-hs256-v1"}
```

Claims del access token emitido:

```json
{
  "iss": "dommia-api",
  "aud": "dommia-resident-api",
  "clientType": "ANDROID | IOS",
  "sub": "<resident-id>",
  "role": "RESIDENT",
  "tenantSlug": "<tenant-slug>",
  "propertyId": "<property-id>",
  "sid": "<session-id>",
  "jti": "<token-id>",
  "iat": 0,
  "exp": 0
}
```

No aceptes un token Resident en rutas de CRM, administración o Guard. Cada guard valida `iss`, `aud`, firma, expiración, rol y sesión revocable. El servidor deriva usuario, tenant y vivienda de los claims; no confía en esos valores cuando llegan del cliente.

Parámetros implementados y verificados en E2E local:

- Access JWT HS256 con expiración de 15 minutos, issuer `dommia-api` y audience `dommia-resident-api`.
- Refresh token opaco, generado con 256 bits aleatorios, por dispositivo.
- Expiración refresh de 30 días de inactividad y límite absoluto de 90 días.
- Rotación obligatoria del refresh token en cada renovación.
- Guardar en PostgreSQL solo el hash del refresh token.
- Si se reutiliza un refresh token anterior, revocar la familia de sesión y registrar el evento.
- Logout revoca el dispositivo actual. El usuario puede consultar y revocar sus otras sesiones.
- Cambio inicial y reset móvil revocan las sesiones móviles activas; el cliente debe borrar access/refresh y volver a login.

Los plazos anteriores son el contrato vigente para las apps móviles y deben cambiarse solo mediante versión coordinada del contrato.

La migración `021_resident_app_refresh_sessions.sql` extiende `public.resident_sessions` con plataforma, dispositivo, última actividad y expiración móvil. `022_resident_push_tokens.sql` añade registro de push por dispositivo. `public.resident_refresh_tokens` guarda hashes y el vínculo de rotación; no guarda tokens en claro. La sesión es la familia de refresh tokens.

Usa `RESIDENT_APP_TOKEN_SECRET`, independiente de `AUTH_TOKEN_SECRET`, para firmar y validar JWT móviles. Ambos secretos son exclusivos del API y se inyectan desde Secret Manager. El header JWT lleva `kid=resident-hs256-v1`. No compartas ninguna clave con Android, iOS o la PWA.

## 4. Flujos de cliente

### Android e iOS

1. El administrador crea o invita al residente. No hay auto-registro público.
2. El residente activa la cuenta y define contraseña, o usa el acceso provisionado por administración.
3. Login envía identificador, contraseña y contexto de tenant. El contexto viene del App Link o de una selección de comunidad, no es un tercer secreto. El backend devuelve `passwordChangeRequired` para una contraseña temporal.
4. El API devuelve access token corto, refresh token opaco, expiraciones y perfil mínimo.
5. El cliente guarda refresh token con Android Keystore o iOS Keychain. El access token se conserva en memoria siempre que sea posible.
6. El interceptor agrega el access token a rutas protegidas.
7. Ante 401, ejecuta una sola renovación por sesión y reintenta una vez la petición original. No repitas automáticamente pagos ni otros POST no idempotentes.
8. Si falla la renovación, borra sesión local y pide login. La reutilización de un refresh token anterior revoca la sesión completa.
9. Logout revoca servidor y elimina ambos tokens del dispositivo.

Usa OkHttp `Authenticator` solo después de tener `/refresh`, rotación, detección de replay y pruebas de concurrencia. Evita renovaciones paralelas con un único refresh token.

### Resident Web / PWA

La PWA actualmente persiste su access JWT en `localStorage`; el contrato no expone refresh token a JavaScript. Para igualar el aislamiento de almacenamiento nativo, la migración futura recomendada es cookie `HttpOnly`, `Secure` y `SameSite` con protección CSRF o un BFF.

No expongas el refresh token a JavaScript. No pongas access ni refresh tokens en `localStorage`, `sessionStorage`, URLs, analytics o logs. Durante la transición, mantén la ruta existente y limita su compatibilidad a la fecha de migración acordada.

## 5. Servicios y recursos necesarios

| Componente | Dónde | Trabajo |
| --- | --- | --- |
| Auth y sesiones Resident | `apps/api`, dentro de `AuthModule` | Login, refresh, logout, lista/revocación de sesiones y guard de audiencia. |
| Persistencia de sesiones | PostgreSQL existente | Migración de `resident_sessions`, hashes de refresh y revocación por dispositivo. |
| Llaves de firma | GCP Secret Manager | Acceso exclusivo desde la cuenta de servicio del API. |
| Rate limiting distribuido | API / borde GCP | Evitar que los límites en memoria se reinicien entre instancias Cloud Run. Evaluar Cloud Armor con Load Balancer o almacenamiento compartido. |
| Almacenamiento nativo de sesión | Android Keystore / iOS Keychain | Cifrar refresh token por plataforma; no requiere un servicio cloud adicional. |
| Identity Provider OIDC | No requerido en ASAP | Añadir solo si se aprueba SSO, Google/Apple Sign-In o federación de identidad. |

No se requiere un nuevo Cloud Run para Auth ni una nueva base. Cloud Run y Cloud SQL existentes alojan el módulo y las tablas de sesiones. FCM/APNs son servicios de notificaciones, no reemplazan la autenticación.

## 6. Recursos protegidos y bloqueos reales

Los recursos Resident Mobile ya están protegidos por guard, rol y tenant/vivienda derivados de la sesión. La suite E2E local 15/15 incluye aislamiento de avisos, acceso/pases, finanzas y sesiones. Las rutas operativas se enumeran en [Contrato Resident Mobile v1](Contrato%20Resident%20Mobile%20v1.md).

Bloqueos restantes antes de habilitar operaciones financieras de producción:

- El upload `POST /api/v1/auth/app/resident/finance/receipts` guarda en disco local y devuelve `local://` solo en DEV; falta storage privado.
- No hay idempotencia persistida para pagos/comprobantes. Los clientes no reintentan POST financieros automáticamente.
- `InMemoryResidentRateLimiter` es por proceso; Cloud Run multi-instancia requiere storage compartido.
- Falta validar secretos, migraciones y CORS en staging, además de entrega real FCM/APNs y enlaces verificados.

## 7. OAuth/OIDC y SSO

No construyas ahora un servidor OAuth/OIDC propio. El flujo nativo primero usa credenciales administradas y autorizadas por DOMMIA con refresh tokens rotatorios.

Si se aprueba SSO o login de terceros, usa un proveedor OIDC administrado y Authorization Code con PKCE para clientes públicos. No implementes Resource Owner Password Credentials, no incluyas `client_secret` en las apps y no conviertas `/login` en una imitación parcial de OAuth.

## 8. Plan de producción

1. **Secretos y configuración:** cargar `AUTH_TOKEN_SECRET`, `RESIDENT_APP_TOKEN_SECRET`, `MFA_ENCRYPTION_KEY` y variables PostgreSQL en Secret Manager/Cloud Run. No distribuir secretos a apps.
2. **Esquema:** desplegar migraciones versionadas 020–022 y ejecutar `docker/validate-schema.sql` contra staging antes de PROD.
3. **Comprobantes/pagos:** aprobar storage privado e idempotencia antes de habilitar esos writes en clientes nativos.
4. **Escalamiento:** sustituir rate limit en memoria por storage distribuido antes de múltiples instancias.
5. **PWA:** mantener rutas actuales mientras se evalúa migración de `localStorage` a cookie/BFF; no retirar rutas legacy sin versionado coordinado.
6. **Clientes:** Android guarda sesión cifrada con Keystore-backed `EncryptedSharedPreferences`; iOS guarda refresh en Keychain. Cada plataforma debe conservar el contrato compartido.
7. **Staging y rollout:** repetir E2E con cuentas QA, validar dominios/HTTPS/CORS, App Links/Universal Links y eventos de replay antes del rollout gradual.

## 9. Criterios de aceptación

- Admin, Resident y Guard no aceptan tokens de otra audiencia.
- Access token vence en el tiempo acordado y refresh token rota en cada uso.
- Un refresh token reutilizado revoca la sesión correspondiente y deja evento de auditoría sin guardar el token.
- Logout y revocación de contraseña invalidan refresh; los access tokens quedan limitados por su expiración corta o por la comprobación de sesión configurada.
- El backend deriva tenant y propiedad de la sesión y rechaza intentos cross-tenant.
- Avisos y finanzas no exponen datos de otra vivienda sin un bearer Resident válido.
- PWA nunca recibe el refresh token en JavaScript y las apps lo guardan con Keystore/Keychain.
- MFA y credenciales no aparecen en logs, telemetría, parámetros URL ni reportes de error.
- Migración y despliegue permiten rollback sin perder la capacidad de revocar sesiones.

## 10. Referencias

- [Desarrollo app Android](Desarrollo%20app%20Android.md): cliente nativo, seguridad y endpoints Resident.
- [Manual de despliegue GCP](../Despliegue%20GCP%20Produccion.md): Cloud Run, Cloud SQL y Secret Manager.
- [Conexión PostgreSQL y multi-tenancy](../Arquitectura/Conexion%20PostgreSQL%20y%20Multi-Tenancy.md): sesiones, migraciones y schemas.
- `apps/api/src/modules/auth/services/auth.service.ts`: login Resident actual.
- `apps/api/src/modules/auth/guards/resident-auth.guard.ts`: validación de sesión Resident actual.
- `apps/api/src/modules/auth/guards/admin-session.guard.ts`: sesión administrativa actual.