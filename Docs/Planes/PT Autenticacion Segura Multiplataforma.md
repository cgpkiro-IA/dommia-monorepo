# PT: autenticación segura multiplataforma

**Prioridad:** ASAP, antes de publicar Resident nativo.
**Alcance:** DOMMIA Resident Web, Android e iOS. CRM, Communities y Guard conservan sus identidades y permisos propios.
**Propietario técnico:** Backend / API.
**Estado actual:** Endpoints móviles implementados y probados en DEV el 2026-09-29. Pendiente configurar `RESIDENT_APP_TOKEN_SECRET` en GCP, cerrar guards de recursos Resident y validar en staging antes de habilitar clientes. OAuth/OIDC no forma parte del MVP.

## 1. Objetivo

Definir un contrato de sesión único y seguro para los clientes Resident, separar sus rutas de autenticación de las cuentas administrativas y mantener el backend como fuente de identidad, permisos, avisos y datos.

Android e iOS deben compartir el mismo contrato Resident. La PWA puede migrar por etapas. No se crearán bases de datos ni servicios de autenticación duplicados por plataforma.

## 2. Decisión recomendada

El dominio de autenticación vive en `AuthModule` y `apps/api`. Es un módulo del monolito NestJS existente, no un microservicio ni un proveedor OAuth nuevo.

Las rutas móviles Resident ya están bajo un espacio independiente:

| Operación | Ruta propuesta |
| --- | --- |
| Login Resident para app | `POST /api/v1/auth/app/resident/login` |
| Cambio inicial de contraseña | `POST /api/v1/auth/app/resident/change-password` |
| Renovar sesión | `POST /api/v1/auth/app/resident/refresh` |
| Logout del dispositivo actual | `POST /api/v1/auth/app/resident/logout` |
| Consultar perfil móvil | `GET /api/v1/auth/app/resident/me` |
| Listar sesiones del residente | `GET /api/v1/auth/app/resident/sessions` |
| Revocar una sesión | `DELETE /api/v1/auth/app/resident/sessions/:id` |

Android e iOS usan las mismas rutas. No agregues `/android` ni `/ios` al contrato. El backend puede guardar `clientPlatform` y `deviceName` como metadatos de sesión, pero esos valores no otorgan permisos.

Mantén `/api/v1/auth/resident/*` durante la migración para no interrumpir la PWA. El bearer legacy de 24 horas continúa funcionando en las rutas existentes. Login y recursos móviles usan las rutas `/auth/app/resident/*`; el guard móvil exige JWT con issuer/audience y `clientType` Android o iOS. Ambos formatos comparten la autorización de recursos Resident compatibles. Cuando la PWA adopte el contrato nuevo, retira las rutas legacy en una versión coordinada.

Las rutas `/api/v1/auth/login` y sus permisos administrativos no se mezclan con Resident. CRM, Communities y Guard no deben aceptar tokens de audiencia Resident.

## 3. Tokens y sesiones

Reemplaza el bearer propio actual por un JWT estándar para los tokens de acceso de aplicación. El cliente lo trata como opaco y nunca contiene una clave para verificar firmas.

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
  "kid": "resident-hs256-v1",
  "iat": 0,
  "exp": 0
}
```

No aceptes un token Resident en rutas de CRM, administración o Guard. Cada guard valida `iss`, `aud`, firma, expiración, rol y sesión revocable. El servidor deriva usuario, tenant y vivienda de los claims; no confía en esos valores cuando llegan del cliente.

Parámetros implementados inicialmente, sujetos a aceptación de Seguridad antes de PROD:

- Access JWT HS256 con expiración de 15 minutos, issuer `dommia-api` y audience `dommia-resident-api`.
- Refresh token opaco, generado con 256 bits aleatorios, por dispositivo.
- Expiración refresh de 30 días de inactividad y límite absoluto de 90 días.
- Rotación obligatoria del refresh token en cada renovación.
- Guardar en PostgreSQL solo el hash del refresh token.
- Si se reutiliza un refresh token anterior, revocar la familia de sesión y registrar el evento.
- Logout revoca el dispositivo actual. El usuario puede consultar y revocar sus otras sesiones.
- Cambio o recuperación de contraseña revoca las sesiones existentes, según política aprobada.

Los plazos anteriores son propuesta inicial para revisión del equipo. No deben quedar codificados como contrato hasta aceptar la política de sesión.

La migración `021_resident_app_refresh_sessions.sql` extiende `public.resident_sessions` con plataforma, dispositivo, última actividad y expiración móvil. `public.resident_refresh_tokens` guarda hashes y el vínculo de rotación; no guarda tokens en claro. La sesión es la familia de refresh tokens.

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

La PWA actualmente persiste un bearer en `localStorage`. Para igualar la protección de las apps nativas, migra la entrega web a una cookie `HttpOnly`, `Secure` y `SameSite`, con protección CSRF, o coloca un BFF que guarde los tokens en servidor.

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

## 6. Rutas que siguen bloqueadas

Antes de dar acceso a Android, iOS o una PWA migrada, protege estas rutas tenant-scoped que hoy no exigen sesión Resident de extremo a extremo:

- Avisos publicados.
- Estado financiero y cargos del residente.
- Envío de comprobante SPEI.
- Campañas, cotizaciones y envíos de pago anual.
- Cambio de contraseña, para que el tenant y el residente salgan de la sesión cuando exista una sesión activa.

Agrega `ResidentAuthGuard`, compara tenant con la sesión y deriva `propertyId` del token. Añade pruebas cross-tenant para cada ruta. Las validaciones en Android/iOS no sustituyen controles del servidor.

## 7. OAuth/OIDC y SSO

No construyas ahora un servidor OAuth/OIDC propio. El flujo nativo primero usa credenciales administradas y autorizadas por DOMMIA con refresh tokens rotatorios.

Si se aprueba SSO o login de terceros, usa un proveedor OIDC administrado y Authorization Code con PKCE para clientes públicos. No implementes Resource Owner Password Credentials, no incluyas `client_secret` en las apps y no conviertas `/login` en una imitación parcial de OAuth.

## 8. Plan ASAP

1. **Contrato y amenaza:** completar revisión de plazos de sesión, política de dispositivos, rate limits y proceso de rotación de `RESIDENT_APP_TOKEN_SECRET` con Seguridad.
2. **Producción:** añadir `RESIDENT_APP_TOKEN_SECRET` a Secret Manager, aplicar migración 021 y comprobar `docker/validate-schema.sql`.
3. **Cerrar endpoints Resident:** añadir guards a avisos y finanzas, derivar tenant/propiedad de sesión y añadir idempotencia de pagos antes de exponerlos a los clientes.
4. **PWA Web:** diseñar la transición desde el bearer `localStorage` a cookie/BFF o mantener la ruta legacy hasta una migración coordinada.
5. **Pruebas de concurrencia y límites:** DEV cubre login Android/iOS, rotación, replay, revocación de dispositivos y compatibilidad PWA. Falta probar refresh concurrente, expiración y rate limiting distribuido.
6. **Clientes:** integrar Android/iOS con almacenamiento Keystore/Keychain y definir si Resident Web adopta el nuevo contrato.
7. **Staging y rollout:** probar con cuentas QA, activar de forma gradual y monitorizar 401, refresh fallidos y eventos de replay.

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