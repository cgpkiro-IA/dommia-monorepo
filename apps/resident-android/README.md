# Dommia Resident Android

This is the initial Android scaffold for the resident app.

## Scope

Current phase: Fase 1 — base technique, network and mobile session.

Included:
- Gradle Kotlin DSL project
- Jetpack Compose app shell
- flavor configuration for dev/prod
- secure session storage scaffold with EncryptedSharedPreferences
- Retrofit client and public/authenticated request flow
- login screen scaffold tied to API mobile endpoints

## Important notes

- Do not add backend changes here.
- Keep production secrets outside the repository.
- The API base URL is configured by build flavor.
- Finance and notices should stay blocked until the backend enforces Resident auth and tenant/property derivation.
