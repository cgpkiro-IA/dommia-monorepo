# DOMMIA Resident iOS

Base nativa SwiftUI para DOMMIA Resident. Android e iOS comparten el contrato descrito en `Docs/Planes/Contrato Resident Mobile v1.md`.

## Estado

La estructura y la capa de autenticacion estan preparadas. Falta abrir el proyecto en macOS/Xcode para crear el target de aplicacion, firmar el bundle y ejecutar el simulador o dispositivo.

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
- `Config/DommiaResident.entitlements` prepara Universal Links para `app.dommia.com`.

## Creacion del target en Xcode

1. En macOS, crea un proyecto iOS SwiftUI llamado `DommiaResident` dentro de esta carpeta.
2. Agrega las carpetas `App`, `Core`, `Features` y `Services` al target.
3. Agrega los archivos `.xcconfig` por configuracion.
4. Asocia `DommiaResident.entitlements` al target.
5. Define el Bundle ID productivo y el Team ID antes de habilitar Universal Links.
6. Ejecuta las pruebas de auth contra el API local o staging.

No agregues secretos de backend, tokens ni contraseñas al bundle.
