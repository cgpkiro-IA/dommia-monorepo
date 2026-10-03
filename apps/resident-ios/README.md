# DOMMIA Resident iOS

Cliente nativo SwiftUI para DOMMIA Resident. Android e iOS comparten el contrato normativo [Contrato Resident Mobile v1](../../Docs/Planes/Contrato%20Resident%20Mobile%20v1.md); esta guía solo describe el estado del scaffold y detalles de plataforma.

## Estado

Los servicios Swift implementan login, refresh/logout, perfil, avisos, invitaciones, credencial de acceso, lectura financiera/campañas, rendiciones mensuales con revisión opcional y upload de recibo en DEV. El upload devuelve `local://` y no es apto para PROD; iOS todavía no envía pagos.

Falta abrir el proyecto en macOS/Xcode para crear/configurar el target de aplicación, firmar el bundle y ejecutar simulador/dispositivo. Estos pasos de plataforma no cambian el contrato HTTP compartido.

## Estructura

```text
resident-ios/
  App/
  Config/
  Core/
    AppConfig/
    Models/
    Network/
    Security/
  Features/Auth/
  Services/
  Package.swift
```

## Configuracion

- `Config/Dev.xcconfig` usa `http://localhost:4000/api/v1` para iOS Simulator.
- `Config/Staging.xcconfig` y `Config/Prod.xcconfig` contienen placeholders HTTPS.
- El refresh token vive en Keychain.
- El access token vive solo en memoria.
- `Config/DommiaResident.entitlements` prepara Universal Links para `app.dommia.com.mx`.

## Creacion del target en Xcode

1. En macOS, crea un proyecto iOS SwiftUI llamado `DommiaResident` dentro de esta carpeta.
2. Agrega las carpetas `App`, `Core`, `Features` y `Services` al target.
3. Agrega los archivos `.xcconfig` por configuracion.
4. Asocia `DommiaResident.entitlements` al target.
5. Define el Bundle ID productivo y el Team ID antes de habilitar Universal Links.
6. Ejecuta las pruebas de auth contra el API local o staging.

No agregues secretos de backend, tokens ni contraseñas al bundle. El refresh se guarda en Keychain; el access token se mantiene en memoria.
