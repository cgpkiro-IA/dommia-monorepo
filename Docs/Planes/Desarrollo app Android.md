# Desarrollo de la app Android DOMMIA Resident

**Estado:** Cliente Android integrado con el contrato móvil v1. El backend autentica y autoriza las rutas Resident; Android consume sesión, perfil, acceso, avisos, invitaciones y lectura/cotización financiera. Envío de pagos y upload de comprobantes no están implementados en Android.
**Producto:** DOMMIA Resident para Android.
**Backend:** API NestJS existente en `apps/api`, contrato HTTP `/api/v1`.
**Stack propuesto:** Kotlin, Jetpack Compose, Material 3, coroutines, Retrofit/OkHttp, DataStore y Keystore.
**Fase activa:** Fase 1 — Base técnica, red, sesión móvil y puerta de acceso al home del residente.

## Estado real del proyecto Android (septiembre 2026)

La app Android ya contempla estos elementos en el código actual:

- Proyecto Android con estructura por features y capas `core/network`, `core/session` y `feature/auth`.
- Login del residente con `tenantSlug`, `identifier`, `password`, `clientType` y manejo de errores de sesión.
- Persistencia segura de tokens con cifrado y recuperación de sesión vencida.
- Validación de sesión al arrancar la app y redirección a login cuando el token o refresh token no son válidos.
- `ResidentHomeScreen` con shell principal, tabs de acceso, avisos y perfil.
- Perfil del residente y vivienda hidratados desde `GET auth/app/resident/me`, incluyendo dirección, interior, manzana, lote, rol, titularidad y estado de cuenta.
- Credencial QR real conectada a `GET auth/app/resident/access-credential`, con renderizado del payload del servidor y renovación al vencer.
- Avisos reales conectados a `GET auth/app/resident/notices`, con refresh, estados de carga/error y lista vacía.
- Pases de visita conectados a `GET/POST/DELETE auth/app/resident/invitations`, con creación, vigencia, notas y revocación.
- Deep links Android para `/activate-resident?token=...&tenant=...` y `/reset-resident?token=...`, conectados a los endpoints backend de activación y restablecimiento.
- Activación, recuperación y cambio inicial de contraseña conectados al login; `passwordChangeRequired` ya detiene el acceso hasta completar el cambio.
- Design system Android alineado con Resident PWA: canvas navy, superficies slate, acentos azul cielo/verde, tipografía sans bold, radios amplios, bordes sutiles y navegación inferior con indicador azul.
- Actividad de acceso conectada a `GET auth/app/resident/access-credential/active-services` y `GET auth/app/resident/access-credential/active-deliveries`, mostrada en Inicio con estados de carga, vacío, error y reintento.
- Estado financiero, campañas y cotización conectados mediante `GET auth/app/resident/finance/status`, `GET auth/app/resident/finance/campaigns` y `POST auth/app/resident/finance/campaigns/:campaignId/quote`; Android no implementa envío de pago ni upload de comprobante.
- Rendiciones mensuales publicadas conectadas mediante `GET auth/app/resident/finance/monthly-reports`; la revisión es opcional y Resident no puede editar ni publicar.
- Pruebas E2E de aislamiento para paths móviles: avisos aislados por tenant y pases aislados por residente/propiedad, incluyendo revocación cruzada rechazada.
- Manejo de sesiones parciales y tokens inconsistentes para evitar que la app trate una sesión rota como autenticada.

Lo que aún no está habilitado en Android es la integración de finanzas y comprobantes. QR, avisos e invitaciones ya consumen paths móviles backend y siguen dependiendo de permisos reales, propietario de vivienda y autorización por tenant.

## 1. Objetivo y alcance

Construye una aplicación nativa Android que permita al residente iniciar sesión en su comunidad y utilizar los servicios Resident disponibles en la API. La aplicación debe mantener el mismo aislamiento por tenant que el servidor y no debe atribuir autoridad a datos guardados en el dispositivo.

El primer release debe cubrir:

- Inicio de sesión con identificador y contraseña. El administrador crea o invita la cuenta; no hay registro público.
- Perfil del residente y datos básicos de su vivienda.
- Credencial QR dinámica cuando el tenant tenga `ACCESS_QR`.
- Alta, consulta, revocación y compartición de pases de visita.
- Avisos de la comunidad.
- Consulta de estado financiero y envío de comprobante SPEI, una vez protegidos los endpoints indicados en la sección 14.
- Estado de paquetes y servicios en tránsito que la API autorice para el residente.
- Cierre de sesión y recuperación de sesión expirada o revocada.

No incluyas en este release RFID, apertura de pluma, autorización de acceso offline, cobros automáticos Stripe, analítica publicitaria ni permisos de cámara. Resident muestra un QR; Guard es quien lo escanea.

## 2. Contrato actual de autenticación

La especificación normativa y compartida con iOS está en [Contrato Resident Mobile v1](Contrato%20Resident%20Mobile%20v1.md). Este documento conserva detalles propios de Android, pero no puede cambiar rutas, campos ni reglas del contrato móvil común.

### Provisionamiento y login

El acceso a DOMMIA Resident lo concede la administración desde el sistema. El residente no crea una cuenta libremente ni elige una comunidad sin invitación. Communities registra o invita al residente; la activación permite establecer su contraseña inicial. La recuperación sirve para recuperar una cuenta existente, no para registrar otra.

La pantalla de login pide solamente identificador y contraseña. El identificador actual es el correo o teléfono registrado, aunque el DTO del backend lo llama `identifier`, no `username`. No añadas OAuth, SSO, inicio de sesión social ni selector de credenciales adicionales en este release.

El backend también exige `tenantSlug` en el request de login. Obtén ese contexto del App Link de invitación o de una selección de comunidad antes del login. Si la app no puede determinar la comunidad de forma fiable, muestra un selector de comunidad separado del formulario de credenciales. `tenantSlug` no es una contraseña ni una autorización; el servidor debe comprobar que la cuenta pertenece al tenant.

### Contratos por cliente

El API mantiene rutas PWA y rutas nativas separadas. Las nuevas sesiones PWA usan JWT HS256 de 24 horas firmado con `AUTH_TOKEN_SECRET`; Android/iOS usan JWT móvil de 15 minutos y refresh opaco rotatorio. El servidor acepta HMAC Resident de dos segmentos emitidos antes del cambio solo hasta su expiración. OAuth/OIDC y SSO siguen fuera de alcance.

La PWA mantiene `POST /api/v1/auth/resident/login`, que envía `identifier`, `password` y `tenantSlug` y emite un JWT Resident de 24 horas firmado con `AUTH_TOKEN_SECRET`. El flujo no crea usuarios: solo autentica una cuenta que el administrador ya provisionó.

Android/iOS usan `POST /api/v1/auth/app/resident/login` con `identifier`, `password`, `tenantSlug`, `clientType` (`ANDROID` o `IOS`) y metadata opcional del dispositivo. El API devuelve `accessToken`, `refreshToken`, `tokenType`, `expiresIn`, `refreshExpiresAt`, `resident`, `tenantSlug`, `clientType` y metadata del dispositivo dentro de `data`. Si la contraseña es temporal, devuelve `passwordChangeRequired` sin tokens. El access token es un JWT HS256 con `iss=dommia-api`, `aud=dommia-resident-api`, `kid=resident-hs256-v1` y expiración de 15 minutos. El cliente debe tratarlo como opaco y no validar sus claims para tomar decisiones de autorización.

El refresh token es opaco, se almacena en PostgreSQL solo como hash, se rota al usarlo y vence después de 30 días sin actividad o 90 días absolutos. Si se reutiliza un token ya rotado, el API revoca esa familia de sesión y escribe `APP_REFRESH_REUSE_DETECTED` en auditoría sin incluir el token. `POST /api/v1/auth/app/resident/refresh` devuelve un nuevo par de tokens. Android lo guarda con Keystore e iOS con Keychain.

La app puede usar `POST /api/v1/auth/app/resident/logout`, `GET /api/v1/auth/app/resident/me`, `GET /api/v1/auth/app/resident/sessions` y `DELETE /api/v1/auth/app/resident/sessions/:id` para cerrar o administrar dispositivos. El endpoint de perfil legado `/api/v1/auth/resident/me` acepta ambos formatos durante la transición. Las rutas de sesión bajo `/auth/app/resident/*` exigen issuer, audience y tipo de cliente móvil. Los endpoints Resident compartidos aceptan bearer legacy PWA o JWT móvil durante la transición.

`AUTH_TOKEN_SECRET` firma sesiones administrativas y el bearer legacy. `RESIDENT_APP_TOKEN_SECRET` firma y valida solo los JWT nativos; ambos viven en Secret Manager y nunca se incluyen en el APK, `BuildConfig`, Remote Config, archivos Gradle ni preferencias Android.

## 3. Arquitectura Android

Organiza la app por features y mantén la UI separada de la red y la persistencia:

```text
app/
  navigation/                 Rutas y deep links
  ui/theme/                   Tema Material 3
core/
  network/                    Retrofit, OkHttp, interceptores y errores
  session/                    Estado de sesión en memoria
  securestorage/              Refresh token cifrado con una llave de Android Keystore
  database/                   Room, solo para datos que se autorice cachear
  model/                      Tipos comunes de API y resultados
feature/
  auth/                       Login, activación, cambio y recuperación
  home/                       Resumen y estado de conexión
  credential/                 QR rotativo de Resident
  invitations/                Pases de visita
  notices/                    Comunicados
  finance/                    Saldos y comprobantes SPEI
```

Usa `ViewModel` con `StateFlow` para estado de pantalla, coroutines para operaciones suspendidas y repositorios para coordinar servicios REST y datos locales. Expón resultados tipados como `Loading`, `Success` y `Error`; no expongas `Response` de Retrofit directamente a Compose.

Centraliza host, serialización, timeouts, headers y parseo de errores en `core/network`. No repitas URLs ni lógica Bearer en ViewModels. El `AuthRepository` coordina login/logout/estado de sesión. `TokenStore` solo lee, guarda, rota y elimina el refresh token; no almacena contraseñas.

No conserves el token en `SavedStateHandle`, argumentos de navegación, logs, eventos analíticos ni estado serializado de UI. Mantén el estado mínimo en memoria después de abrir la app.

## 4. Gradle y configuración por ambiente

Crea un workspace Android independiente, por ejemplo `apps/resident-android/`, con Kotlin DSL y catálogo de versiones. Añádelo al monorepo solo cuando se acuerden los límites Gradle/Turbo. No mezcles artefactos Gradle con `NEXT_PUBLIC_*` de Next.js.

Define flavors `dev` y `prod`. Inyecta un `API_BASE_URL` público por flavor con `BuildConfig` o un mecanismo de configuración de build equivalente:

| Flavor | API base |
| --- | --- |
| `dev` en emulador Android | `http://10.0.2.2:4000/api/v1/` |
| `dev` en dispositivo físico | `http://<IP_LAN_DEL_EQUIPO_DEV>:4000/api/v1/` |
| `prod` | `https://<API_DOMAIN>/api/v1/` |

En el emulador, `localhost` representa al emulador, no al host Windows. Usa `10.0.2.2` para llegar al API local. En un teléfono físico usa la IP LAN del equipo y confirma que el firewall permite el puerto 4000.

No guardes secretos en `local.properties` versionado, `BuildConfig` ni recursos Android. La URL API y los identificadores públicos no son secretos. Las credenciales de producción permanecen en GCP Secret Manager para los servicios de servidor.

### Configuración Android que debe mantenerse documentada

- La dependencia `com.google.zxing:core:3.5.3` genera la imagen QR a partir del `payload` exacto del backend; no genera credenciales ni códigos localmente.
- Los tokens visuales Android viven en `ui/theme`: canvas `#0B1120`, surface `#0F172A`, surface elevada `#1E293B`, primary `#60A5FA`, secondary `#38BDF8`, tertiary/status success `#34D399`, error `#F87171` y texto principal `#F8FAFC`.
- `API_BASE_URL` DEV usa `http://10.0.2.2:4000/api/v1/` en el emulador. PROD debe sustituir `<API_DOMAIN>` por el dominio HTTPS real antes de generar el AAB.
- Los endpoints de activación y reset mantienen el contrato existente: `POST auth/resident/activate` y `POST auth/resident/password-reset`. No se deben cambiar a rutas PWA nuevas ni registrar sus tokens en logs.
- El secreto `RESIDENT_APP_TOKEN_SECRET` no pertenece a Android; se configura únicamente en el backend mediante Secret Manager.
- Push móvil usa `POST/DELETE auth/app/resident/devices/push-token` con `deviceId` persistente por instalación. `fcm-token` permanece como alias compatible para clientes Android existentes; la plataforma se deriva de `clientType` en el JWT. La tabla actual es `public.resident_push_tokens`; no se añade una migración para este contrato.
- El host de App Links es `app.dommia.com.mx` en `manifestPlaceholders["appLinksHost"]` para DEV y PROD. El sitio debe servir `/.well-known/assetlinks.json` con el package name y la huella SHA-256 del certificado de firma correspondiente.
- El application ID efectivo es `com.dommia.resident` para PROD release y `com.dommia.resident.dev.debug` para DEV debug, debido a los sufijos de flavor y build type.
- La firma PROD usa la huella SHA-256 de Play App Signing. DEV usa la huella del keystore debug si se desea verificar App Links en dispositivos de prueba.
- Ninguna huella de firma, token de activación, token de reset ni secreto de backend se guarda en el repositorio.

## 5. API y requests

Configura Retrofit con base URL terminada en `/`, JSON con el mismo casing que el DTO del backend y un `CallAdapter` simple basado en coroutines. Agrega `Accept: application/json` y `Content-Type: application/json` cuando envíes JSON.

Para rutas protegidas, OkHttp agrega `Authorization: Bearer <token>`. No agregues ese header a login, activación o recuperación si todavía no existe una sesión. Define una anotación o etiqueta de request pública para que el interceptor no adjunte tokens por accidente a esos endpoints.

Ejemplo conceptual del login:

```kotlin
@Serializable
data class ResidentAppLoginRequest(
    val identifier: String,
    val password: String,
    val tenantSlug: String,
  val clientType: String,
  val deviceId: String?,
  val deviceName: String?,
)

interface AuthApi {
  @POST("auth/app/resident/login")
  suspend fun login(@Body request: ResidentAppLoginRequest): ApiEnvelope<ResidentAppLoginData>

  @POST("auth/app/resident/refresh")
  suspend fun refresh(@Body request: ResidentRefreshRequest): ApiEnvelope<ResidentAppLoginData>
}
```

`ApiEnvelope<T>` debe reflejar el wrapper actual `{ success, message, data }`. No transformes errores HTTP en éxito; conserva status, mensaje del servidor y un mensaje seguro para la UI.

Codifica segmentos de ruta y query con las utilidades de Retrofit. Nunca concatenes una entrada arbitraria del usuario en una URL. Conserva exactamente el `tenantSlug` que devuelve el API; no lo derives del nombre visible de la comunidad.

## 6. Endpoints Resident

El contrato normativo y completo está en [Contrato Resident Mobile v1](Contrato%20Resident%20Mobile%20v1.md). Esta sección resume rutas que Android usa y compatibilidad PWA; no es una fuente alternativa de DTOs ni autorizacion.

Todas las rutas de esta tabla llevan el prefijo `https://<API_DOMAIN>/api/v1/` en PROD.

| Operación | Método y ruta | Autenticación actual | Notas |
| --- | --- | --- | --- |
| Login de la PWA | `POST auth/resident/login` | Pública | Ruta conservada. Emite JWT HS256 de 24 h firmado con `AUTH_TOKEN_SECRET`; los tokens HMAC de dos segmentos ya emitidos se aceptan solo hasta expirar. |
| Login móvil | `POST auth/app/resident/login` | Pública | Android/iOS. Body `identifier`, `password`, `tenantSlug`, `clientType`, `deviceId?`, `deviceName?`. Devuelve JWT access de 15 min y refresh opaco. |
| Cambio inicial móvil | `POST auth/app/resident/change-password` | Pública con contraseña actual | Body `identifier`, `tenantSlug`, `currentPassword`, `newPassword`; se usa cuando login devuelve `passwordChangeRequired`. |
| Refresh móvil | `POST auth/app/resident/refresh` | Refresh token opaco en body | Rota el refresh token; replay revoca la sesión móvil y genera auditoría. |
| Perfil móvil | `GET auth/app/resident/me` | Bearer móvil | Exige issuer/audience/app claims. |
| Logout móvil | `POST auth/app/resident/logout` | Bearer móvil | Revoca sesión y refresh tokens del dispositivo. |
| Sesiones móviles | `GET/DELETE auth/app/resident/sessions` | Bearer móvil | Lista dispositivos propios y permite revocar una sesión por ID. |
| Activar cuenta provisionada | `POST auth/resident/activate` | Pública con token de activación | El administrador inicia la invitación. Body `token`, `password`. El enlace es de un uso y expira según el flujo de activación. No permite auto-registro. |
| Perfil Resident legacy | `GET auth/resident/me` | Bearer Resident | La PWA usa el bearer legacy. El servidor deriva el residente y tenant de los claims. |
| Logout Web legado | `POST auth/resident/logout` | Bearer legacy | Revoca `jti` en el servidor. |
| Cambiar contraseña PWA | `POST auth/resident/change-password` | Pública, valida contraseña actual | Body incluye `tenantSlug`, `identifier`, `currentPassword`, `newPassword`; no es una ruta de cambio autenticado de sesión. |
| Solicitar recuperación | `POST auth/resident/password-recovery` | Pública | Respuesta genérica para no revelar si existe la cuenta. |
| Restablecer contraseña | `POST auth/resident/password-reset` | Pública con token de recuperación | Body `token`, `newPassword`. No registra el token en logs ni analytics. |
| Credencial QR | `GET auth/resident/access-credential` | Bearer Resident | Requiere entitlement `ACCESS_QR`; respuesta no-cache. |
| Pases del residente | `GET/POST auth/resident/invitations` | Bearer Resident | Crear envía `visitorName`, `passType`, `validDays`, `notes?`. `passType`: `SINGLE_USE`, `TEMPORARY` o `FREQUENT`; `validDays`: 1–30. |
| Revocar pase | `DELETE auth/resident/invitations/:id` | Bearer Resident | Verifica que el pase pertenezca a la sesión. |
| Vista web compartible | `GET tenants/:slug/access/invitations/:id/pass` | Pública | Devuelve el QR dinámico para el enlace compartido. La respuesta indica `Cache-Control: no-store`. |
| Metadata de tenant | `GET tenants/:slug` | Pública hoy | Se usa para nombre/módulos; no debe devolver datos personales. |
| Servicios activos | `GET auth/resident/access-credential/active-services` | Bearer Resident | Respuesta acotada a la vivienda de la sesión. |
| Entregas activas | `GET auth/resident/access-credential/active-deliveries` | Bearer Resident | Respuesta acotada a la vivienda de la sesión. |
| Avisos Resident | `GET auth/app/resident/notices` | Bearer Resident válido | `ResidentAuthGuard`; requiere audiencia `RESIDENTS` y tenant derivado de la sesión. |
| Estado financiero PWA | `GET tenants/:slug/finance/properties/:propertyId/status` | Bearer Resident | Tenant y `propertyId` deben coincidir con la sesión; ruta legacy conservada. |
| Envío SPEI PWA | `POST tenants/:slug/finance/payments/spei-submissions` | Bearer Resident | Requiere propiedad y tenant propios. Android no consume esta ruta legacy. |
| Campañas compartidas | `GET tenants/:slug/finance/annual-campaigns` | Bearer Resident o administración | `FinanceCampaignGuard` valida tenant/rol; Android usa la ruta móvil app-only. |
| Cotización PWA | `POST tenants/:slug/finance/annual-campaigns/:campaignId/quote` | Bearer Resident o administración | Para Resident, `propertyId` del body debe coincidir con su sesión; Android usa la ruta móvil app-only. |
| Envío de pago anual PWA | `POST tenants/:slug/finance/annual-campaigns/:campaignId/submissions` | Bearer Resident | Tenant y vivienda se comparan con la sesión. No hay idempotencia financiera implementada. |
| Checkout Stripe | `POST tenants/:slug/stripe/checkout` | Bearer Resident | Opcional por entitlement; no es requisito del MVP. |
| Estado de Stripe | `GET tenants/:slug/stripe/session/:sessionId` | Bearer Resident | Opcional por entitlement; no es requisito del MVP. |

### Rutas móviles compartidas por Android e iOS

Las rutas `/api/v1/auth/app/resident/*` son el contrato nativo. Las rutas de sesión, dispositivos, acceso y finanzas exigen `ResidentAppAuthGuard`; avisos usa `ResidentAuthGuard` para permitir sesiones Resident compatibles durante la transición. Tenant, vivienda y permisos siempre los decide el API.

| Operación móvil | Método y ruta | Fuente de tenant/vivienda |
| --- | --- | --- |
| Credencial QR | `GET auth/app/resident/access-credential` | Claims `tenantSlug` y `propertyId` del JWT móvil |
| Servicios activos | `GET auth/app/resident/access-credential/active-services` | Claims del JWT móvil |
| Entregas activas | `GET auth/app/resident/access-credential/active-deliveries` | Claims del JWT móvil |
| Avisos publicados | `GET auth/app/resident/notices` | `tenantSlug` del JWT; filtra audiencia `RESIDENTS` |
| Pases del residente | `GET/POST auth/app/resident/invitations` | Claims del JWT móvil |
| Revocar pase | `DELETE auth/app/resident/invitations/:id` | Identidad y tenant del JWT móvil |
| Estado financiero | `GET auth/app/resident/finance/status` | `propertyId` y `tenantSlug` del JWT móvil |
| Campañas activas | `GET auth/app/resident/finance/campaigns` | `tenantSlug` del JWT móvil |
| Cotizar campaña | `POST auth/app/resident/finance/campaigns/:campaignId/quote` | `propertyId` del JWT móvil |
| Enviar SPEI | `POST auth/app/resident/finance/spei-submissions` | `propertyId` del JWT; no se acepta del body |
| Enviar pago de campaña | `POST auth/app/resident/finance/campaigns/:campaignId/submissions` | `propertyId` del JWT; no se acepta del body |
| Rendiciones mensuales | `GET auth/app/resident/finance/monthly-reports` | Solo publicaciones del tenant de sesión; `POST .../:id/review` registra revisión opcional |

Las rutas protegidas se verifican con E2E de autenticación, rol y aislamiento tenant. La PWA puede conservar HMAC de dos segmentos ya emitidos solo hasta su expiración; los nuevos logins Resident emiten JWT HS256 estándar. Usa [Contrato Resident Mobile v1](Contrato%20Resident%20Mobile%20v1.md) como fuente normativa para cualquier ruta o DTO.

## 7. Manejo de sesión

Al recibir login exitoso:

1. La implementación actual persiste access token, refresh token y perfil en `EncryptedSharedPreferences`, con `MasterKey` respaldada por Android Keystore. No describir este estado como “access token solo en memoria”; cualquier cambio de almacenamiento debe preservar cifrado en reposo y limpieza de sesión.
2. Mantén perfil y claims visuales en memoria; si necesitas cachearlos, considera esos datos PII y limita campos, retención y backup.
3. Si login devuelve `passwordChangeRequired`, completa cambio de contraseña y vuelve a iniciar sesión.
4. Solicita `GET auth/app/resident/me` para validar la sesión móvil y cargar el perfil del servidor.
5. Ante 401, serializa una única llamada a refresh. Guarda el nuevo refresh token antes de reintentar una vez la request protegida.

El inicio de sesión normal solo presenta identificador y contraseña. No muestres un flujo “Crear cuenta”. Si la cuenta aún no fue activada por una invitación administrativa, guía al residente a solicitar el enlace a la administración.

Para cada respuesta 401, limpia token y datos privados, cancela requests en curso y vuelve al login con un mensaje de sesión vencida o revocada. No repitas automáticamente un `POST` financiero después de un timeout; el servidor hoy no ofrece idempotency key para estos envíos. Para 403 presenta que el módulo o acción no está habilitado. Para 429 aplica espera y permite reintento manual. Para errores de red conserva solo datos cacheados permitidos.

El API limita login, activación, recuperación, reset y refresh por proceso. Android debe validar campos localmente para UX, pero el servidor sigue siendo la autoridad. No expongas stack traces ni cuerpo de excepción en la UI. Antes de escalar Cloud Run a varias instancias, mueve estos límites a un mecanismo distribuido compartido.

No almacenes, imprimas ni envíes contraseñas después de la request. Limpia los campos y su estado de UI al terminar login, activación o cambio de contraseña.

## 8. Almacenamiento cifrado y transporte

Usa HTTPS con validación normal de certificados en todos los builds release. No implementes un `TrustManager` que acepte cualquier certificado. No desactives hostname verification. Certificate pinning no es requisito inicial; solo añádelo con estrategia operativa de rotación de certificados.

En release, bloquea tráfico cleartext con `android:usesCleartextTraffic="false"` y `network_security_config`. Si DEV requiere HTTP hacia `10.0.2.2` o una IP LAN, permite cleartext solo en el manifest/configuración del flavor debug. Verifica que el manifest merged de `prod` no incluya esa excepción.

No cifres manualmente cada JSON antes de enviarlo. TLS protege el transporte. HMAC firma tokens y códigos TOTP; no cifra su contenido. `AUTH_TOKEN_SECRET` permanece exclusivamente en el API.

No guardes tokens en `SharedPreferences` plano. El `SessionManager` actual usa `EncryptedSharedPreferences` con una `MasterKey` AES-GCM respaldada por Android Keystore y persiste access token, refresh token y perfil. Excluye tokens, archivos de sesión y datos privados de Android Auto Backup. Al hacer logout, 401 o revocación, elimina ambos tokens y el estado privado.

La preferencia Android `EncryptedSharedPreferences` del documento adjunto es una opción de almacenamiento local, no el protocolo del servidor. El API nativo ya emite refresh tokens; la PWA legacy aún no los usa.

## 9. QR y códigos TOTP

El API genera la credencial del residente. `GET auth/resident/access-credential` devuelve `code`, `payload`, `stepExpiresAt` y tiempo restante. El código actual tiene 8 dígitos y rota cada 15 segundos. El JSON del payload identifica `app`, `kind`, `tenant`, `subjectId`, `step` y `code`.

La app solo debe representar en QR el `payload` exacto que devuelve el servidor. No calcules el código con un secreto local ni caches payload/QR para usar después. No compartas una captura estática. La validación requiere conexión y el servidor rechaza paso vencido, tenant diferente o replay. El reloj del teléfono solo sirve para mostrar el contador; el servidor decide si el QR es válido.

Solicita la credencial con cache HTTP desactivada. Limpia QR y payload al cerrar sesión, cambiar tenant, vencer respuesta o perder la sesión. Mientras no haya conexión, muestra que el acceso digital no se puede validar; no inventes un estado autorizado.

## 10. Offline y sincronización

La PWA actual cachea shell, perfil, invitaciones y avisos con IndexedDB. Eso no convierte el API en offline-first. La cola de sincronización actual en la PWA simula la eliminación de elementos locales y no implementa una API general de sincronización.

Para Android:

- Permite apertura del shell y lectura de avisos cacheados con caducidad visible, si Producto aprueba ese comportamiento.
- No autorices accesos, no generes pagos ni envíes comprobantes cuando falte red.
- No guardes en Room el bearer token como texto, secretos TOTP, contraseñas o códigos QR vigentes.
- Separa los datos por tenant y elimina caché privada al logout o al cambiar de cuenta.
- No reintentes automáticamente operaciones financieras sin contrato de idempotencia.

Push notifications no están listas solo por existir un Service Worker en la PWA. Antes de implementar FCM, Backend debe definir registro/revocación de token de dispositivo, preferencias por tenant y una política de expiración del token FCM.

## 11. Interfaz y accesibilidad

Usa Jetpack Compose y Material 3. Mantén el tema DOMMIA como fallback y permite Dynamic Color en Android 12+. Respeta modo claro/oscuro y el tamaño de letra del sistema.

Implementa navegación con Navigation Bar para 3–5 destinos principales en teléfonos y Navigation Rail en ventanas medianas o ampliadas. Usa Window Size Classes, `Scaffold` y edge-to-edge; no diseñes solo para un tamaño fijo.

Usa targets táctiles de al menos 48dp, labels para iconos, soporte TalkBack y contraste accesible. Prueba escala de fuente del 200%, rotación, teclado abierto y recuperación de proceso. El botón Atrás debe respetar la navegación del sistema y el predictive back.

El MVP Resident no requiere cámara, contactos, ubicación ni almacenamiento compartido. Pide el permiso de notificaciones solo cuando FCM esté conectado y el usuario llegue a una acción que lo explique.

## 12. Deep links y archivos

La app debe poder abrir enlaces de activación y recuperación enviados por correo o WhatsApp:

- `/activate-resident?token=...&tenant=...`
- `/reset-resident?token=...&tenant=...`
- Enlace de pase compartible con tenant e identificador del pase.

Configura Android App Links con dominio HTTPS, `assetlinks.json`, application ID y huella SHA-256 del certificado de firma de Play App Signing. Valida el tenant contra el enlace y la respuesta del API. No guardes tokens de activación o reset en analytics o logs. Conserva una página web fallback si la app no está instalada.

Configuración implementada en Android:

- `https://<APP_LINK_HOST>/activate-resident?token=...&tenant=...` abre el flujo de activación.
- `https://<APP_LINK_HOST>/reset-resident?token=...` abre el flujo de restablecimiento.
- `MainActivity` procesa el enlace al iniciar y mediante `onNewIntent` cuando la app ya está abierta.
- El token vive únicamente en memoria durante el formulario y se descarta al completar o salir del flujo.
- El sitio debe publicar `https://<APP_LINK_HOST>/.well-known/assetlinks.json` con los dos application IDs y las huellas SHA-256 correspondientes. Este archivo no se debe completar con una huella ficticia.

Antes de implementar recibos, confirma el contrato de `receiptUrl`: el API recibe una cadena, pero la guía actual no define un endpoint Android para subir el archivo a almacenamiento privado ni para obtener una URL firmada. No envíes documentos sensibles a un bucket público.

## 13. Errores, observabilidad y privacidad

En DEV usa Network Inspector o Chucker con cuentas y datos QA. Deshabilita Chucker en release. Redacta `Authorization`, contraseñas, tokens, QR, referencias bancarias, recibos, correo y teléfono.

Registra eventos técnicos sin PII: endpoint lógico, status HTTP, duración y correlation ID si el servidor lo ofrece. No registres bodies de login ni tokens. El API actual no documenta un correlation ID, así que no lo asumas como requisito de contrato.

Define aviso de privacidad, datos recopilados, retención y proceso de borrado antes de publicar en Play. Configura R8/ProGuard y firma Android App Bundle; guarda la llave de firma fuera del repositorio, con acceso controlado y respaldo.

## 14. Bloqueos de release

La suite E2E del backend valida guardas Resident, aislamiento tenant/vivienda y sesiones (15/15 local el 2026-09-30). No reimplementar estos controles en Android ni usar rutas financieras sin Bearer.

1. **Recibos productivos:** el endpoint actual valida y almacena archivos solo localmente en DEV (`storage=LOCAL_DEV`, `receiptUrl=local://...`). No enviar comprobantes reales en PROD.
2. **Idempotencia financiera:** no hay clave ni persistencia idempotente; no reintentar automáticamente envíos de pago/comprobante.
3. **Despliegue:** configurar `RESIDENT_APP_TOKEN_SECRET`, `AUTH_TOKEN_SECRET`, `MFA_ENCRYPTION_KEY`, CORS HTTPS y migraciones 020–022 en staging/PROD.
4. **Escala:** sustituir el rate limiter Resident en memoria por storage compartido antes de desplegar varias instancias.
5. **Integración Android:** estado/campañas/cotización están conectados; envío de pago y upload siguen sin implementarse en el cliente.

## 15. Integración backend verificada

La suite E2E API verificó 15/15 pruebas locales el 2026-09-30. Incluye login/MFA, guards Resident, avisos, acceso, sesiones, refresh, replay, revocación y aislamiento tenant/vivienda. El contrato normativo es [Contrato Resident Mobile v1](Contrato%20Resident%20Mobile%20v1.md); Android no debe duplicar autorización ni aceptar un `propertyId` que contradiga la sesión.

El backend ya protege avisos, acceso, invitaciones y finanzas móviles. Cambio/reset móvil revocan las sesiones nativas activas; refresh rota y detecta replay; push token tiene registro/revocación con alias `fcm-token` para compatibilidad.

Los únicos bloqueos backend de release son los enumerados en la sección 14: almacenamiento privado productivo de recibos, idempotencia financiera persistida, rate limiting distribuido y validación en staging/proveedores/dispositivos reales.

## 16. Plan de desarrollo

### Fase 1 — Base técnica, red y autenticación móvil

La base ejecutable existe: Gradle/Kotlin, Compose, flavors, Retrofit/OkHttp, login, refresh coordinado, almacenamiento cifrado y perfil. Mantén estos criterios como regresiones; no bloquean el trabajo ya integrado de perfil, QR, avisos o invitaciones.

1. **Mantener el workspace Android.** El módulo `apps/resident-android` ya existe con Gradle Kotlin DSL, Compose, Retrofit/OkHttp y almacenamiento cifrado. No incorporar secretos de producción.
2. **Validar ambientes.** Conservar flavors `dev` y `prod`, `API_BASE_URL` por flavor y reglas de cleartext; en `prod` no debe haber HTTP claro.
3. **Definir la capa de red.** Crear DTOs de login, refresh y perfil siguiendo el contrato actual; centralizar base URL, headers, timeouts, serialización y manejo de errores. Añadir un interceptor que inserte `Authorization: Bearer ...` solo para endpoints autenticados.
4. **Definir modelo de respuesta.** Reutilizar el envelope `{ success, message, data }` del backend y traducir errores HTTP a estados `Loading`, `Success` y `Error` en la capa de UI. Evitar exponer `Response` de Retrofit directamente en Compose.
5. **Mantener sesión segura.** `SessionManager` y `AuthRepository` ya guardan tokens en `EncryptedSharedPreferences` respaldada por Keystore y coordinan login, refresh, logout, restore e invalidación por 401. No guardar tokens en preferencias planas, `SavedStateHandle`, logs ni backups.
6. **Implementar autenticación funcional.** Login de residente con `identifier`, `password`, `tenantSlug`, `clientType`, `deviceId`, `deviceName`; manejo de `passwordChangeRequired`; validación de 401, 403 y 429; flujo de recuperación y reintento manual. Mantener la UX sin “crear cuenta” ni flujos de registro público.
7. **Implementar carga de perfil y estado de sesión.** Llamar a `GET auth/app/resident/me` para validar la sesión y cargar el perfil del servidor; también preparar la pantalla de sesión vencida/revocada.
8. **Añadir pruebas de la base técnica.** MockWebServer para la capa REST, tests unitarios del `AuthRepository`/`SessionManager` y pruebas de integración para refresh, 401 y rotación de refresh token.
9. **Validar despliegue local y real.** Probar login y refresh con emulador y dispositivo físico sobre la IP LAN, verificar que el backend usa `10.0.2.2` o IP válida y confirmar que release no permite cleartext.

### Fase 2 — Perfil, QR, pases y deep links

1. Perfil del residente y datos básicos de vivienda desde `GET auth/app/resident/me`.
2. QR dinámico conectado a `GET auth/app/resident/access-credential`, usando el payload del servidor y sin caché.
3. Pases de visita con creación, consulta y revocación desde `/auth/app/resident/invitations`.
4. Deep links para activación y reset conectados a `POST auth/resident/activate` y `POST auth/resident/password-reset`.
5. Revisión de tenant, propiedad y módulo antes de permitir acceso a cada feature.
6. Servicios activos y entregas pendientes mostrados en Inicio desde los endpoints móviles y derivados de `propertyId` del JWT.
7. Estado financiero y campañas mostrados en Inicio; comprobantes pendientes de contrato seguro de upload e idempotencia.

La app recibe los enlaces y persiste la sesión cifrada según `SessionManager`. Recuperación usa `POST auth/app/resident/password-recovery`; el cambio inicial usa `POST auth/app/resident/change-password` y revoca las sesiones móviles existentes. Queda pendiente publicar `.well-known/assetlinks.json` en el dominio productivo con la huella SHA-256 real de Play App Signing; no se debe subir una huella ficticia.

### Fase 3 — Avisos y finanzas

Avisos, estado financiero, campañas y cotizaciones ya usan rutas protegidas y contexto derivado de la sesión. No implementar pagos ni recibos de producción hasta que el backend entregue storage privado e idempotencia; ver bloqueos de la sección 14.

### Fase 4 — Publicación y hardening

1. AAB firmado, R8/ProGuard, privacidad, observabilidad y QA de acceso.
2. TalkBack, fuentes grandes, rotación, recuperación de proceso.
3. Smoke tests en Play Internal Testing con tenant QA.

## 17. Criterios de aceptación

- Login, activación y recovery funcionan con el DTO actual y no filtran credenciales.
- No existe registro público; solo inicia sesión una cuenta provisionada o invitada por un administrador.
- En Android/iOS, el access token vence a los 15 minutos y refresh rota; Android protege tokens con `EncryptedSharedPreferences` respaldada por Keystore e iOS guarda refresh en Keychain. Logout y replay revocan la sesión móvil. La PWA conserva rutas Resident legacy y tokens previos de dos segmentos hasta expirar.
- Cada endpoint privado envía token y el backend verifica sesión, tenant y vivienda.
- El QR se representa desde la respuesta del servidor, rota a los 15 segundos y nunca autoriza offline.
- Los datos financieros no aparecen para otra vivienda o tenant. Mientras el backend no ofrezca idempotencia, la app no reintenta automáticamente envíos de pago.
- No existe tráfico HTTP cleartext en el AAB release.
- No hay secretos, tokens, datos personales o recibos en logs, analytics, screenshots de tests ni backups Android.
- App Links solo verifican los dominios productivos y mantienen fallback web.
- Build/lint/tests pasan para DEV y PROD; los puntos bloqueados de la sección 14 tienen evidencia de cierre.

## 18. Referencias DOMMIA

- [Plan de Desarrollo Maestro por Fases](Plan%20de%20Desarrollo%20Maestro%20por%20Fases.md): alcance MVP y prioridades actuales.
- [Arquitectura de PostgreSQL y multi-tenancy](../Arquitectura/Conexion%20PostgreSQL%20y%20Multi-Tenancy.md): schemas tenant, migraciones y fuente de verdad.
- [Protocolo de seguridad](../Arquitectura/Protocolo%20de%20Seguridad%20y%20Proteccion%20de%20Propiedad%20Intelectual.md): MFA y secretos del servidor.
- [Manual GCP](../Despliegue%20GCP%20Produccion.md): dominios, API base, secretos y ambientes de producción.
- `apps/resident-pwa/src/features/auth/hooks/useResidentAuth.ts`: flujo de sesión que Android reemplaza.
- `apps/api/src/modules/auth/guards/resident-auth.guard.ts`: claims, expiración y revocación del Bearer Resident.
- `apps/api/src/modules/access/services/access.service.ts`: QR TOTP de 8 dígitos y ventana de 15 segundos.