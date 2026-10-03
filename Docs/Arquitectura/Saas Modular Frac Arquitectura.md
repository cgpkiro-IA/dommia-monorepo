# Arquitectura C4, Decisiones Arquitectónicas y Estrategia de Evolución
# Anexo A - Arquitectura
## Propósito

Este documento constituye la referencia arquitectónica oficial del proyecto SaaS Modular para Fraccionamientos. Integra la arquitectura C4, las decisiones técnicas aprobadas, la estrategia de escalamiento y los lineamientos para el desarrollo del MVP y su evolución hacia una plataforma Enterprise.

---

# Principios Arquitectónicos

1. PostgreSQL será la fuente única de verdad.
2. El MVP minimizará complejidad operativa.
3. La arquitectura debe soportar crecimiento sin rediseños mayores.
4. El sistema será Multi-Tenant usando Schemas de PostgreSQL.
5. La operación offline será responsabilidad de IndexedDB y SQLite, nunca de Redis.
6. Redis será considerado únicamente como componente de escalamiento.
7. Se iniciará con un Monolito Modular en NestJS.
8. La separación de dominios deberá permitir evolución futura a microservicios.

---

# C4 Nivel 1 - Contexto del Sistema

## Actores

### Super Admin SaaS
Opera la plataforma completa.

### Ejecutivo Comercial
Gestiona prospectos, activaciones, renovaciones y seguimiento comercial.

### Administrador de Fraccionamiento
Administra propiedades, residentes, finanzas y accesos.

### Guardia
Gestiona validaciones y monitoreo de accesos.

### Residente
Utiliza los servicios operativos y de acceso.

## Sistemas Externos

- Stripe
- Correo Electrónico
- WhatsApp Business
- Push Notifications
- MQTT Broker

---

# Dominios Principales

## CRM Maestro SaaS

Uso exclusivo del operador del negocio.

Funciones:
- Prospectos
- Clientes
- Activaciones
- Renovaciones
- Facturación SaaS
- Inventario de Hardware
- Monitoreo de Gateways
- Alertas Operativas
- Dashboard Ejecutivo
- Dashboard Financiero
- Dashboard de Soporte

## Portal Operativo del Fraccionamiento

Funciones:
- Residentes
- Propiedades
- Finanzas
- Accesos
- Invitaciones
- Comunicación
- Reportes

## Plataforma IoT

Funciones:
- Control de Gateways
- Sincronización
- RFID
- QR
- OTA
- Telemetría

---

# C4 Nivel 2 - Contenedores

## Frontend CRM Maestro

Tecnología:
- NextJS

## Frontend Portal Operativo

Tecnología:
- NextJS
- React
- PWA
- Service Workers
- IndexedDB

## Backend Principal

Tecnología:
- NestJS Monolito Modular

Dominios:
- Auth
- CRM
- Tenants
- Residentes
- Finanzas
- Accesos
- IoT
- Notificaciones
- Auditoría

## MQTT Broker

Recomendado:
- EMQX

## PostgreSQL

Contendrá:
- Schema Global
- Schemas por Tenant

## Object Storage

- Evidencias
- Comprobantes
- Documentos
- Archivos

## Redis (Opcional)

No forma parte del MVP.

Se habilitará únicamente cuando el crecimiento lo justifique.

---

# C4 Nivel 3 - Componentes

## Auth Service

- Login
- MFA TOTP opcional para cuentas administrativas, con desafío posterior a contraseña cuando está habilitado
- Passport JWT HS256 para sesiones nuevas y `ApiAuthGuard` global con excepciones públicas explícitas (`@Public`).
- JWT Resident móvil de 15 min con issuer/audience propios y refresh token opaco rotatorio; guardar refresh como hash.
- Compatibilidad temporal con tokens Resident/admin HMAC de dos segmentos ya emitidos, solo hasta expirar.
- Recuperación de Contraseña
- RBAC con `@Roles` y `RolesGuard` global; guards locales validan tenant, vivienda, audiencia y sesión.

## CRM Service

- Prospectos
- Clientes
- Pipeline Comercial
- Activaciones
- Renovaciones
- Gestión Comercial

## Tenant Service

- Alta de Fraccionamientos
- Activación
- Suspensión
- Upgrade de Plan
- Provisionamiento de Schemas

## Finance Service

- Cuotas
- Cobros
- Estados de Cuenta
- Stripe
- Conciliación
- Recargos

## Access Service

- RFID
- QR Dinámico
- Invitaciones
- Control de Morosidad
- Historial de Accesos

## Notification Service

- Email
- WhatsApp
- Push Notifications

## IoT Service

- Registro de Gateway
- Heartbeats
- OTA
- Certificados
- Telemetría
- Command Dispatcher

## Audit Service

- Auditoría
- Eventos
- Evidencias
- Trazabilidad

---

# Arquitectura IoT

## Gateway de Caseta

Componentes:
- MQTT Client
- SQLite
- Sync Manager
- RFID Adapter
- QR Adapter
- Relay Controller
- Health Monitor

Funciones:
- Operación Offline
- Validación Local
- Sincronización Diferida
- Apertura de Pluma

---

# Estrategia Oficial de Almacenamiento

## PostgreSQL

Responsable de:
- Residentes
- Propiedades
- Finanzas
- Auditoría
- Configuración
- Históricos

## IndexedDB

Responsable de:
- Operación Offline de Residentes
- Invitaciones Temporales
- Caché Local
- Preferencias

## SQLite

Responsable de:
- Operación Offline de Caseta
- TAGs RFID
- Invitaciones
- Eventos Pendientes
- Bloqueos

---

# ADR-001 Redis

## Decisión

Redis NO será requerido para el MVP.

## Justificación

- Menor complejidad operativa.
- Menor costo.
- Menos infraestructura.
- Menor curva de aprendizaje.

## Componentes preparados para Redis

- Caché de configuración.
- Sesiones distribuidas.
- Rate limiting.
- Estado de gateways.
- Colas con BullMQ.

## Disparadores para adopción

- Más de 50 fraccionamientos activos.
- Más de 100 Gateways conectados.
- Más de 1000 usuarios concurrentes.
- Necesidad de procesamiento asíncrono masivo.
- Dashboards en tiempo real avanzados.

## Restricciones

Nunca almacenar exclusivamente en Redis:

- Pagos.
- Estados de cuenta.
- Residentes.
- Propiedades.
- Auditoría.
- Históricos.

---

# Modelo de Datos

## Global Schema (public)

- **saas_plans:** Catálogo dinámico de tiers (`BASIC`, `STANDARD`, `PROFESSIONAL`, `ENTERPRISE`), precios mensuales, topes de vivienda y módulos/add-ons permitidos.
- **tenants:** Fraccionamientos registrados con identificación de esquema (`tenant_<slug>`), banderas de dominio propio (`has_custom_domain`), dominio asignado (`custom_domain`) y URL de acceso (`access_url`: estándar `standar.dommia.com.mx/{slug}` o subdominio exclusivo `{slug}.dommia.com.mx`).
- **subscriptions:** Contratos activos, IDs de pasarela Stripe, fechas de vigencia y cobros recurrentes de planes y add-ons.
- **crm_prospects:** Pipeline comercial de ventas consultivas (LEAD -> WON).
- **gateway_inventory:** Inventario de hardware IoT y monitoreo de heartbeats.
- **users:** Usuarios de plataforma central (SUPER_ADMIN, COMMERCIAL_EXEC, SUPPORT).
- **MFA administrativo:** `users.mfa_enabled`, secretos TOTP cifrados y último paso consumido; `auth_mfa_challenges` conserva vencimiento, intentos y consumo del desafío temporal.
- **audit_logs:** Trazabilidad de operaciones críticas.
- **billing:** Registros de facturación fiscal (CFDI).
- **support_tickets:** Gestión de incidencias de soporte técnico.

## Política de Enrutamiento y Dominios

1. **Dominio Estándar Compartido:** `standar.dommia.com.mx/{slug}` para planes BASIC, STANDARD y PROFESSIONAL.
2. **Subdominio Personalizado Add-on:** `{slug}.dommia.com.mx` disponible como módulo de pago mensual adicional (+ $490 MXN/mes).
3. **Subdominio Personalizado Enterprise:** `{slug}.dommia.com.mx` bonificado 100% sin costo adicional en plan ENTERPRISE.

## Tenant Schema

- residents
- properties
- vehicles
- rfid_tags
- invitations
- access_logs
- payments
- balances
- notifications

---

# Seguridad

## Requerimientos Obligatorios

- MFA TOTP opcional por cuenta para administradores. La configuración está en [Protocolo de Seguridad](./Protocolo%20de%20Seguridad%20y%20Proteccion%20de%20Propiedad%20Intelectual.md).
- JWT firmado con claves separadas por audiencia/uso; secretos solo en configuración backend validada con Joi.
- `ValidationPipe` global con `transform`, `whitelist` y rechazo de propiedades desconocidas en DTOs.
- Helmet para cabeceras HTTP y CORS con allowlist exacta; en producción solo orígenes HTTPS configurados.
- TLS.
- Rotación de llaves.
- RBAC.
- Auditoría completa.
- Certificados por Gateway.

---

# Observabilidad

## Logs

- Aplicación
- Seguridad
- IoT
- Finanzas

## Alertas

- Gateway Offline
- MQTT Offline
- Stripe Error
- Replicación Fallida

---

# Roadmap Arquitectónico
# Conexión PostgreSQL vigente

El API comparte un `pg.Pool` por proceso. El acceso multi-tenant configura `search_path` con `set_config` parametrizado, limpia la sesión antes de liberar el cliente y centraliza SQL en repositorios. El DDL se gestiona con migraciones y aprovisionamiento, no dentro de requests. Ver [Conexión PostgreSQL y Multi-Tenancy](./Conexion%20PostgreSQL%20y%20Multi-Tenancy.md).

# Roadmap Arquitectónico

## MVP

- CRM Maestro
- Portal Operativo
- Auth
- Residentes
- Finanzas
- Stripe
- MQTT
- SQLite
- IndexedDB

## Escalamiento

- Redis
- BullMQ
- Observabilidad Avanzada
- Kubernetes

## Enterprise

- Microservicios Selectivos
- Redis Distribuido
- Event Streaming
- Multi Región

---

# Decisión Arquitectónica Final

Stack Inicial:

- NextJS
- React PWA
- NestJS Monolito Modular
- PostgreSQL Multi-Tenant
- SQLite
- IndexedDB
- MQTT (EMQX)
- Docker

Redis queda aprobado como capacidad de crecimiento futuro, pero no como dependencia del MVP.
