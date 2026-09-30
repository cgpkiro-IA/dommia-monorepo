# Desarrollo de la app iOS DOMMIA Resident

**Estado:** Base técnica para el desarrollo nativo en iOS. El scaffold inicial vive en `apps/resident-ios`; la apertura y firma del target Xcode requieren macOS.
**Producto:** DOMMIA Resident para iOS.
**Backend:** API NestJS existente en `apps/api`, contrato HTTP `/api/v1`.
**Stack propuesto:** SwiftUI, MVVM, Repository, URLSession/async-await, Keychain, Combine/AsyncStream si se requiere, y arquitectura modular por features.

**Contrato móvil común:** [Contrato Resident Mobile v1](Contrato%20Resident%20Mobile%20v1.md). Android e iOS comparten las mismas rutas `/api/v1/auth/app/resident/*`; esta guía solo define decisiones específicas de iOS.

Los enlaces de activación y recuperación también son comunes: `/activate-resident?token=...&tenant=...` y `/reset-resident?token=...&tenant=...`. iOS deberá integrarlos como Universal Links cuando exista el workspace nativo; mientras tanto, el fallback web sigue siendo válido.

---

## 1. Objetivo del proyecto

Construir una aplicación nativa en iOS que permita a un residente autenticarse en su comunidad, consultar su información, operar con pases de visita, avisos, finanzas y otros servicios autorizados por el backend.

La app debe respetar las mismas reglas del sistema:

- No hay registro público ni auto-creación de cuentas.
- La cuenta la crea o invita la administración del sistema.
- El tenant se identifica con `tenantSlug` y el backend valida la pertenencia del residente.
- La app no debe asumir permisos por su cuenta; todos los accesos se validan en el servidor.
- La autenticación es segura, con token corto de acceso y refresh token rotatorio.
- La app no debe guardar secretos ni tokens en `UserDefaults`.

### Alcance inicial recomendado

- Login con identificador y contraseña.
- Selección o resolución de `tenantSlug` desde el deep link o pantalla de comunidad.
- Cambio de contraseña cuando el backend indique `passwordChangeRequired`.
- Perfil del residente y datos esenciales del hogar.
- Consulta del estado de avisos.
- QR de acceso si el tenant lo habilita.
- Gestión de invitaciones y pases de visita.
- Consulta de estado financiero y comprobantes, solo cuando el backend lo autorice.
- Cierre de sesión y recuperación cuando el token expire o sea revocado.

No formar parte del MVP inicial:

- OAuth/OIDC externo.
- Login social.
- Registro público.
- Aperturas físicas, RFID, hardware, sensores o validación offline de acceso.
- Stripe o pagos automáticos si no están habilitados por el backend.

---

## 2. Contexto real del sistema DOMMIA

El repositorio principal es un monorepo con backend NestJS y apps web. El backend es la fuente de verdad para autenticación, permisos, tenant y datos del residente.

### Estructura base relevante

- `apps/api`: API principal y negocio.
- `docker/`: migraciones y bootstrap PostgreSQL.
- `Docs/`: arquitectura, planes, despliegue y reglas del producto.
- `packages/`: tipos compartidos y utilidades.

### Principios del sistema que la app iOS debe respetar

- Aislamiento por tenant y por schema de base de datos.
- Todos los pasos de autorización se resuelven en el backend.
- El cliente nunca decide si un residente tiene acceso a un recurso.
- Los tokens viven separados por tipo: access token de corta vida y refresh token opaco.
- El cliente debe tratar los tokens como datos sensibles y no imprimirlos ni registrarlos.

---

## 3. Arquitectura recomendada para iOS

Se recomienda usar **MVVM + Repository + Network Manager + Secure Storage**.

```text
[ SwiftUI View ]
       ↕
[ ViewModel @MainActor ]
       ↕
[ Repository ]
       ↕
[ Network Manager (URLSession) ]
       ↕
[ Keychain Manager ]
```

### Capas

#### 3.1 Vista (SwiftUI)

- Mostrar pantallas y estados (loading, success, error, empty).
- No contener lógica de negocio.
- No manipular tokens ni construir peticiones.
- Comunicarse con el ViewModel por medio de bindings o `@Published`.

#### 3.2 ViewModel

- Encapsular el estado de la pantalla.
- Ejecutar requests con `async/await`.
- Exponer estados tipados como `Loading`, `Loaded`, `Error`, `LoggedOut`.
- Centralizar navegación y validaciones básicas de UX.

#### 3.3 Repository

- Abstraer la fuente de datos.
- Decidir si la data se obtiene del backend, de caché local o de sesión.
- Centralizar login, refresh, logout y lectura de perfil.

#### 3.4 Network Manager

- Encapsular `URLSession`.
- Ejecutar requests HTTP.
- Manejar headers, serialización JSON, errores y refresh token.
- Inyectar `Authorization: Bearer <token>` solo cuando aplica.

#### 3.5 Secure Storage

- Guardar refresh token y cualquier dato sensible en Keychain.
- No usar `UserDefaults` para credenciales ni tokens.
- Si se guarda session state local, hacerlo con cifrado y limitando la información almacenada.

---

## 4. Seguridad y buenas prácticas iOS

### 4.1 Almacenamiento seguro

**Prohibido:**

- Guardar contraseñas, access tokens o refresh tokens en `UserDefaults`.
- Guardar tokens en logs, analytics, crash reports o `print()`.
- Serializar la sesión en archivos de configuración o snapshots de UI.

**Obligatorio:**

- Usar Keychain para cualquier dato sensible.
- Retener el access token en memoria cuando sea posible.
- Guardar solo el refresh token en almacenamiento persistente.
- Limpiar sesión al cerrar sesión, al detectar revocación o al recibir 401.

### 4.2 HTTPS y ATS

- Todo el tráfico debe ser HTTPS en producción.
- La app debe mantener y respetar App Transport Security (ATS).
- No desactivar `ATS` ni aceptar certificados inválidos.
- Para entorno local, usar solo un perfil de desarrollo explicitamente configurado.

### 4.3 Biometría

- Se puede usar Face ID / Touch ID para desbloquear la sesión localmente.
- No reemplaza la autenticación con backend; solo refuerza la experiencia local.
- La biometría debe ser opcional y configurada desde la UX, no obligatoria por defecto.

### 4.4 No guardar secretos de servidor en la app

La app no debe incluir:

- `AUTH_TOKEN_SECRET`
- `RESIDENT_APP_TOKEN_SECRET`
- claves privadas del backend
- secretos de producción
- tokens de acceso en código fuente o bundles

La clave de firma del backend vive exclusivamente en el servidor y nunca se comparte con la app nativa.

---

## 5. Contrato actual de autenticación Resident

La especificación normativa para Android e iOS está en [Contrato Resident Mobile v1](Contrato%20Resident%20Mobile%20v1.md). Las siguientes notas resumen únicamente lo necesario para implementar iOS y no sustituyen ese contrato.

El backend mantiene dos contratos de autenticación durante la transición:

### 5.1 PWA legacy

- Ruta: `POST /api/v1/auth/resident/login`
- Body: `identifier`, `password`, `tenantSlug`
- Token: bearer legacy de 24 horas
- Se mantiene para la PWA actual

### 5.2 App nativa (Android/iOS)

- Ruta: `POST /api/v1/auth/app/resident/login`
- Body esperado:

```json
{
  "identifier": "correo@dominio.com",
  "password": "********",
  "tenantSlug": "mi-comunidad",
  "clientType": "IOS",
  "deviceId": "UUID-del-dispositivo",
  "deviceName": "iPhone de Juan"
}
```

Respuesta de login exitoso:

```json
{
  "success": true,
  "data": {
    "accessToken": "jwt",
    "refreshToken": "opaque-token",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "refreshExpiresAt": "2026-10-29T12:00:00.000Z",
    "resident": { "id": "...", "email": "..." },
    "tenantSlug": "mi-comunidad",
    "clientType": "IOS",
    "deviceId": "UUID-del-dispositivo",
    "deviceName": "iPhone de Juan"
  }
}
```

Si la contraseña es temporal, el login no entrega tokens. Devuelve `data.passwordChangeRequired = true` y `tenantSlug`; la app debe llamar a `change-password` y ejecutar login nuevamente.

### Reglas clave del backend

- El access token móvil es JWT HS256.
- Issuer: `dommia-api`
- Audience: `dommia-resident-api`
- `kid`: `resident-hs256-v1`
- Expira en 15 minutos.
- El cliente no debe usar el contenido del JWT para decisiones de negocio.
- El refresh token es opaco, generado por el backend, guardado con hash en PostgreSQL.
- El refresh token rota al usarse.
- Si se reutiliza un refresh token ya rotado, el backend revoca la familia de sesión y registra auditoría.
- El `tenantSlug` se usa como contexto de la comunidad y no como secreto.

### Regla del producto

La cuenta del residente no se crea desde la app. El residente es provisionado por la administración. La app solo valida credenciales y contexto del tenant.

---

## 6. Flujos de autenticación sugeridos

### 6.1 Login

1. El usuario escribe email/telefono y contraseña.
2. La app obtiene el `tenantSlug` del deep link o selección de comunidad.
3. Envío a `POST /api/v1/auth/app/resident/login`.
4. Si `passwordChangeRequired` es true:
  - no se guardan tokens porque todavía no existen
  - se fuerza cambio de contraseña usando `identifier`, `tenantSlug`, `currentPassword` y `newPassword`
   - luego se vuelve a intentar login
5. Si la respuesta es válida:
   - guardar refresh token en Keychain
   - guardar access token en memoria
   - cargar perfil usando `GET /api/v1/auth/app/resident/me`
   - navegar al home

### 6.2 Refresh token

- Cuando el access token vence, la app debe usar `POST /api/v1/auth/app/resident/refresh`.
- El backend rotará el refresh token.
- La app debe guardar el nuevo refresh token y borrar el anterior.
- Si la renovación falla por 401 o por refresh token reutilizado:
  - cerrar sesión local
  - limpiar token y datos sensibles
  - volver a login

### 6.3 Logout

- Enviar `POST /api/v1/auth/app/resident/logout`.
- Borrar refresh token del Keychain.
- Borrar el access token de memoria.
- Limpiar caché personal del usuario.

### 6.4 Cambio de contraseña

- Ruta: `POST /api/v1/auth/app/resident/change-password`
- Debe usarse si el backend exige contraseña temporal o si el usuario la cambia desde settings.
- Debe requerir validación local de fuerza de contraseña y confirmación.
- Después del cambio, limpiar tokens viejos si el backend así lo exige.

---

## 7. Estructura recomendada del proyecto iOS

```text
DommiaResidentApp/
  App/
    DommiaResidentApp.swift
    AppRoot.swift

  Core/
    AppConfig/
    Network/
      APIClient.swift
      APIEndpoint.swift
      AuthInterceptor.swift
      RequestSerializer.swift
      APIError.swift
    Security/
      KeychainManager.swift
      SessionStore.swift
      TokenManager.swift
    Utilities/
      DateFormatter.swift
      Logger.swift
      AppConstants.swift

  Features/
    Auth/
      LoginView.swift
      LoginViewModel.swift
      ChangePasswordView.swift
      ChangePasswordViewModel.swift
    Home/
      HomeView.swift
      HomeViewModel.swift
    Profile/
      ProfileView.swift
      ProfileViewModel.swift
    Notices/
      NoticesView.swift
      NoticesViewModel.swift
    Invitations/
      InvitationsView.swift
      InvitationsViewModel.swift
    Finance/
      FinanceView.swift
      FinanceViewModel.swift
    Access/
      AccessCredentialView.swift
      AccessCredentialViewModel.swift

  Models/
    AuthModels.swift
    User.swift
    Tenant.swift
    GenericResponse.swift

  Services/
    AuthService.swift
    ProfileService.swift
    NoticesService.swift
    InvitationsService.swift
    FinanceService.swift

  Persistence/
    LocalStore.swift
    CachePolicies.swift
```

### Principios de organización

- Una feature por dominio funcional.
- Una capa `Core` reutilizable para networking, seguridad y configuración.
- Modelos estrictamente tipados con `Codable`.
- ViewModels para cada pantalla.
- No mezclar lógica de red y UI.

---

## 8. Implementación de red para iOS

### 8.1 Base de networking

Se recomienda `URLSession` nativo con `async/await` y una capa centralizada.

Ejemplo conceptual:

```swift
import Foundation

enum APIError: Error {
    case invalidURL
    case unauthorized
    case forbidden
    case serverError(Int)
    case decoding
    case unknown
}

struct APIClient {
    let session: URLSession

    func request<T: Decodable>(_ endpoint: Endpoint, responseType: T.Type) async throws -> T {
        guard let url = endpoint.url else { throw APIError.invalidURL }

        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        if let body = endpoint.body {
            request.httpBody = try JSONEncoder().encode(body)
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }

        if let token = TokenManager.shared.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await session.data(for: request)

        guard let http = response as? HTTPURLResponse else {
            throw APIError.unknown
        }

        switch http.statusCode {
        case 200...299:
            do {
                return try JSONDecoder().decode(T.self, from: data)
            } catch {
                throw APIError.decoding
            }
        case 401:
            throw APIError.unauthorized
        case 403:
            throw APIError.forbidden
        default:
            throw APIError.serverError(http.statusCode)
        }
    }
}
```

### 8.2 Interceptor de auth

La app debe centralizar el manejo de tokens en un interceptor o autenticador:

- Inyectar `Authorization` para endpoints protegidos.
- Si la respuesta es 401:
  - intentar refresh una sola vez
  - reintentar la petición original
  - si falla, cerrar sesión
- No repetir automáticamente operaciones no idempotentes.

### 8.3 Modelo de respuesta

El backend responde con un envelope de tipo `success, message, data`. La app debe decodificarlo con modelos tipados y no suponer que cualquier 200 es éxito real.

```swift
struct APIEnvelope<T: Decodable>: Decodable {
    let success: Bool
    let message: String?
    let data: T?
}
```

---

## 9. Manejo de sesión en iOS

### 9.1 Persistencia de sesión

- `accessToken`: almacenamiento en memoria, con limpieza al cerrar sesión.
- `refreshToken`: almacenamiento en Keychain.
- `tenantSlug`: almacenamiento seguro o dato de sesión.
- `userId`, `email`, `perfil`: almacenamiento solo si es necesario para UX, preferentemente caché local con límites.

### 9.2 Revocación y limpieza

Cuando hay 401, refresh inválido, sesión revocada o error de autorización:

1. borrar access token de memoria
2. borrar refresh token del Keychain
3. borrar caché de sesión y perfil local
4. volver a inicio de sesión
5. mostrar un mensaje claro: “Tu sesión expiró o fue cerrada.”

### 9.3 Sincronización de sesión

- La app debe usar `actor` o una entidad central de sesión para evitar condiciones de carrera.
- Solo una operación de refresh debe correr de manera concurrente.
- Si varias pantallas demandan data protegida, deben compartir la misma sesión activa.

---

## 10. Recomendación de flujo por feature

### 10.1 Login

Pantallas:

- `LoginView`
- `CommunitySelectionView` si la comunidad no se conoce por deep link
- `PasswordChangeRequiredView`

Responsabilidades:

- Capturar identificador y contraseña.
- Enviar body con `tenantSlug` y `clientType = IOS`.
- Manejar estados de error, captcha o contraseña temporal.
- No crear registros ni mostrar opciones no permitidas.

### 10.2 Perfil

- Endpoint: `GET /api/v1/auth/app/resident/me`
- Debe usarse para cargar nombre, vivienda, tenant y permisos básicos.
- Si falla, mostrar sesión caducada.

### 10.3 Avisos

- El endpoint debe validarse del lado del backend.
- El cliente no debe asume que una ruta pública es segura.
- Si la ruta no exige sesión auténtica, no se debe consumir en producción.

### 10.4 Invitaciones y pases

- Endpoint principal: `GET/POST/DELETE` de Resident invitations según el backend.
- Debe validarse que el pase pertenece al tenant y a la vivienda del usuario.
- Para compartir QR o datos, usar UI con un manejo cuidadoso de PII y no registrar contenido del QR en logs.

### 10.5 Finance

- Los endpoints financieros deben protegerse con sesión Resident válida y validación del tenant/propiedad.
- La app no debe construir `propertyId` localmente si el backend debe derivarlo del token.
- No enviar pagos o comprobantes sin idempotencia y validación del servidor.

---

## 11. Manejo de errores y UX

La app debe transformar errores del backend en mensajes claros para el usuario:

- 401 → sesión vencida / cambiar de sesión
- 403 → permiso o acceso no permitido
- 404 → recurso no encontrado
- 409 → conflicto de estado
- 429 → demasiado intentos, espera y reintento
- 500 → error del servicio, sin filtrar stack traces

### Reglas de UX

- No mostrar mensajes técnicos del backend a usuarios finales.
- No mostrar tokens ni JWTs en la UI.
- No guardar pantallas de error con datos sensibles.
- La app debe ofrecer una sola acción clara: repetir, reintentar login o volver al inicio.

---

## 12. Persistencia local y caché

Se puede usar `CoreData` o una pequeña capa local si el producto lo requiere. Pero se debe mantener una regla estricta:

- Los datos sensibles o de sesión no se persisten como strings planos.
- La caché local debe estar separada por tenant.
- Los avisos, perfil y datos del hogar solo se cachean si el backend lo justifica.
- No guardar datos de pago o comprobantes en un caché sin política de eliminación.

---

## 13. Testing

### 13.1 Unit tests

- `TokenManager`
- `SessionManager`
- `APIErrorMapper`
- serialización JSON de modelos
- validación de refresh logic

### 13.2 Integration tests

- login real contra API local o staging
- refresh con token válido
- refresh con token reutilizado
- logout y revocación del dispositivo
- error 401 y reintento único

### 13.3 UI tests

- login con éxito
- contraseña temporal
- sesión vencida
- 401 con retorno a login
- cambio de contraseña

No se deben usar mocks para validar comportamiento de sesión en lugar de validar la lógica real de red y tokens.

---

## 14. Consideraciones de despliegue

### Ambiente de desarrollo

- API local: `http://localhost:4000/api/v1/` o IP LAN cuando se usa un dispositivo físico.
- El emulador usa `localhost` como la propia máquina virtual. En iOS Simulator, por lo general se usa `localhost` o la IP del equipo dependiendo del contexto.
- En un dispositivo físico, usar la IP LAN del equipo y verificar el firewall.

### Ambiente de staging

- Usar un host específico de staging con HTTPS.
- Configurar certificados y variables por entorno.
- No mezclar configuración de desarrollo y producción.

### Producción

- La API debe estar desplegada con `RESIDENT_APP_TOKEN_SECRET` y con la migración 021 aplicada.
- La app no debe incluir secretos ni rutas internas.
- La gestión de refresh tokens debe estar protegida con rotación y auditoría.

---

## 15. Criterios de aceptación para el release iOS

La app está lista para release cuando:

- Login, refresh, logout y cambio de contraseña funcionan con el backend.
- El refresh token se guarda en Keychain y no en `UserDefaults`.
- La app responde correctamente a 401 y revocación de sesión.
- El tenant se valida en cada request y no se permiten cross-tenant.
- La app no expone tokens, secretos ni información sensible en logs o crash reports.
- Las rutas protegidas se consumen con `Authorization: Bearer ...`.
- La app mantiene compatibilidad con la transición de PWA + app nativa.
- Los endpoints financieros y avisos están protegidos por backend antes de su uso en la app.

---

## 16. Checklist de implementación para el equipo

### Fase 1: base del cliente

- [ ] Crear proyecto SwiftUI modular.
- [ ] Configurar entornos `Dev`, `Staging` y `Prod`.
- [ ] Crear `APIClient`, `Endpoint`, `APIError` y `JSONDecoder`.
- [ ] Crear `KeychainManager` y `TokenManager`.
- [ ] Crear `SessionManager` con refresh y cleanup.

### Fase 2: autenticación

- [ ] Implementar login con `identifier`, `password`, `tenantSlug`, `clientType = IOS`.
- [ ] Implementar refresh y manejo de 401.
- [ ] Implementar logout.
- [ ] Implementar flujo de cambio de contraseña.
- [ ] Crear pantalla de sesión vencida y de login.

### Fase 3: perfil y navegación

- [ ] Obtener perfil por `/auth/app/resident/me`.
- [ ] Crear navigation root y manejo de sesión activa.
- [ ] Definir pantallas principales y home del residente.

### Fase 4: módulos funcionales

- [ ] Avisos.
- [ ] Invitaciones y pases.
- [ ] QR de acceso.
- [ ] Finance y comprobantes, solo bajo backend protegido.

### Fase 5: polish y seguridad

- [ ] Revisión de Keychain.
- [ ] Revisión de logging y red.
- [ ] UI de validación de sesión.
- [ ] Tests unitarios/integration.
- [ ] Revisión final de producción.

---

## 17. Resumen ejecutivo

La app iOS de DOMMIA Resident debe ser un cliente nativo seguro, modular y desacoplado del backend. La autenticación debe seguir el contrato móvil del API y nunca inventar su propia identidad. La base técnica es SwiftUI + MVVM + Repository + Keychain + URLSession con `async/await`. El backend es la autoridad final para autenticación, tenant, permisos y validación de cada operación. La app debe almacenar tokens de forma segura, manejar refresh con prudencia y nunca depender de datos sensibles no validados del lado cliente.

Este documento es la base técnica para que un desarrollador iOS sin contexto del sistema pueda entender la arquitectura, el contrato de autenticación y los pasos necesarios para arrancar la app nativa.
