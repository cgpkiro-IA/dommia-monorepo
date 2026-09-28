# 🏛️ Estándar de Arquitectura Backend en 3 Capas — DOMMIA API

**Fecha de Publicación:** 24 de Septiembre, 2026  
**Versión:** 1.0.0  
**Ámbito:** `apps/api` (NestJS / Node.js Backend Core)  
**Autor:** Antigravity AI & Equipo de Arquitectura Dommia

---

## 🎯 1. Propósito y Justificación

A medida que el backend del SaaS DOMMIA crece en funcionalidades (CRM, Multi-tenancy, Control de Viviendas, Residentes, Vehículos, Finanzas e IoT), agrupar la lógica de transporte HTTP, las reglas de negocio y las consultas SQL en un solo archivo ("God Services" como un `tenants.service.ts` de más de 500 líneas) genera:

1. **Alto acoplamiento:** Cambiar una consulta SQL o agregar una columna impacta directamente la lógica de negocio y los controladores.
2. **Imposibilidad de pruebas unitarias limpias:** No se puede probar una regla de negocio (ej. validación del límite de casas del plan) sin una conexión real a PostgreSQL.
3. **Dificultad de lectura y navegación:** Archivos masivos que mezclan endpoints disímiles (tenants con autos y residentes).

Para resolver esto de forma definitiva y sostenible, se establece la **Arquitectura en 3 Capas por Dominio** (adaptación de Clean Architecture / Puertos y Adaptadores para NestJS).

---

## 🧱 2. Las Tres Capas del Backend

```
          [ Cliente HTTP / REST / Mobile / IoT ]
                            │
                            ▼
    ┌───────────────────────────────────────────────────┐
    │  CAPA 1: TRANSPORTE & PRESENTACIÓN (Controllers)  │
    │  - Routing HTTP, Pipes, Guards, DTOs de entrada   │
    │  - Códigos de respuesta HTTP (200, 201, 400, 404) │
    └───────────────────────┬───────────────────────────┘
                            │ (Invoca)
                            ▼
    ┌───────────────────────────────────────────────────┐
    │  CAPA 2: LÓGICA DE NEGOCIO (Services / Use Cases) │
    │  - Reglas del negocio SaaS (Límite duro de casas) │
    │  - Cálculo de cuotas, anti-bot, validaciones      │
    │  - Totalmente agnóstico de HTTP y de SQL          │
    └───────────────────────┬───────────────────────────┘
                            │ (Invoca)
                            ▼
    ┌───────────────────────────────────────────────────┐
    │  CAPA 3: ACCESO A DATOS (Repositories)            │
    │  - Consultas a PostgreSQL (SELECT, INSERT, etc.)  │
    │  - Multi-tenant dinámico (search_path)            │
    │  - Transacciones y mapeo de datos                 │
    └───────────────────────────────────────────────────┘
```

---

### Capa 1: Transporte y Presentación (`controllers/` y `dto/`)
- **Responsabilidad Única:** Recibir peticiones de la red (HTTP REST, WebSockets o MQTT), parsear cabeceras y parámetros, validar payloads entrantes con DTOs tipados (`class-validator`), y emitir la respuesta HTTP estandarizada (`success: boolean, data, message`).
- **Regla Estricta:** 
  - ❌ **PROHIBIDO:** Ejecutar sentencias SQL (`SELECT`, `UPDATE`).
  - ❌ **PROHIBIDO:** Tomar decisiones de lógica de negocio (ej. verificar si una casa es morosa o si se superó el límite del plan).
  - ✅ **PERMITIDO:** Inyectar el servicio correspondiente y retornar su resultado envuelto en el formato estándar de respuesta.

### Capa 2: Lógica de Negocio (`services/`)
- **Responsabilidad Única:** Encapsular las reglas y políticas del negocio SaaS de DOMMIA:
  - Validar si una suscripción permite agregar más propiedades (`max_properties`).
  - Detectar honeypots anti-spam y descartar bots.
  - Formatear números de teléfono y normalizar placas vehiculares.
  - Orquestar múltiples operaciones entre repositorios.
- **Regla Estricta:**
  - ❌ **PROHIBIDO:** Conocer objetos del framework web (`Request`, `Response`, `express`).
  - ❌ **PROHIBIDO:** Escribir consultas SQL con sintaxis de base de datos directa.
  - ✅ **PERMITIDO:** Inyectar repositorios para solicitar datos y persistir entidades de dominio.

### Capa 3: Acceso a Datos y Persistencia (`repositories/`)
- **Responsabilidad Única:** Gestionar la interacción con el motor de base de datos (PostgreSQL 16):
  - Ejecutar consultas parametrizadas contra el esquema global `public` o el esquema dinámico del tenant (`tenant_<slug>`).
  - Control de aislamiento multi-tenant mediante `set_config('search_path', $1, false)` con schema normalizado y valor ligado.
  - Manejo de transacciones ACID (`BEGIN`, `COMMIT`, `ROLLBACK`).
- **Regla Estricta:**
  - ❌ **PROHIBIDO:** Lanzar excepciones HTTP directas (ej. `HttpException`). Debe retornar `null` o lanzar errores de dominio/datos que el servicio traducirá.
  - ❌ **PROHIBIDO:** Aplicar reglas de interfaz o autenticación web.

---

## 📁 3. Organización de Carpetas por Dominio Funcional

El pool, el cambio seguro de schema, la limpieza de la sesión y el uso correcto de transacciones se rigen por [Conexión PostgreSQL y Multi-Tenancy](./Conexion%20PostgreSQL%20y%20Multi-Tenancy.md). La capa de aplicación no ejecuta DDL durante requests.

Cada dominio del negocio vive en `apps/api/src/modules/<dominio>/` y contiene su propia separación en 3 capas:

```
apps/api/src/
├── common/                                 # Elementos transversales reutilizables
│   ├── decorators/                         # Decoradores personalizados (@TenantSlug, @CurrentUser)
│   ├── filters/                            # Filtros globales de excepción HTTP
│   └── guards/                             # Guards de autenticación y RBAC
│
├── database/                               # Driver base de conexión PostgreSQL
│   ├── database.module.ts
│   └── database.service.ts                 # Pool de conexiones y ejecutor multi-inquilino
│
├── modules/                                # Módulos de Dominio (3 Capas cada uno)
│   │
│   ├── tenants/                            # Aprovisionamiento de Fraccionamientos
│   │   ├── controllers/
│   │   │   └── tenants.controller.ts       # Capa 1: Transporte HTTP
│   │   ├── services/
│   │   │   └── tenants.service.ts          # Capa 2: Lógica de provisionamiento
│   │   ├── repositories/
│   │   │   └── tenants.repository.ts       # Capa 3: Queries public.tenants
│   │   ├── dto/
│   │   │   └── create-tenant.dto.ts
│   │   └── tenants.module.ts
│   │
│   ├── properties/                         # Viviendas, Lotes y Cuotas de Capacidad
│   │   ├── controllers/
│   │   │   └── properties.controller.ts    # Capa 1: Endpoints /tenants/:slug/properties
│   │   ├── services/
│   │   │   └── properties.service.ts       # Capa 2: Reglas de límite duro y métricas
│   │   ├── repositories/
│   │   │   └── properties.repository.ts    # Capa 3: Queries tenant_<slug>.properties
│   │   ├── dto/
│   │   │   ├── create-property.dto.ts
│   │   │   └── update-property.dto.ts
│   │   └── properties.module.ts
│   │
│   ├── residents/                          # Padrón de Residentes e Inquilinos
│   │   ├── controllers/
│   │   │   └── residents.controller.ts     # Capa 1: Endpoints /tenants/:slug/residents
│   │   ├── services/
│   │   │   └── residents.service.ts        # Capa 2: Reglas de roles y titularidad
│   │   ├── repositories/
│   │   │   └── residents.repository.ts     # Capa 3: Queries tenant_<slug>.residents
│   │   ├── dto/
│   │   │   ├── create-resident.dto.ts
│   │   │   └── update-resident.dto.ts
│   │   └── residents.module.ts
│   │
│   ├── vehicles/                           # Control Vehicular y Placas
│   │   ├── controllers/
│   │   │   └── vehicles.controller.ts      # Capa 1: Endpoints /tenants/:slug/vehicles
│   │   ├── services/
│   │   │   └── vehicles.service.ts         # Capa 2: Normalización de placas y validación
│   │   ├── repositories/
│   │   │   └── vehicles.repository.ts      # Capa 3: Queries tenant_<slug>.vehicles
│   │   ├── dto/
│   │   │   ├── create-vehicle.dto.ts
│   │   │   └── update-vehicle.dto.ts
│   │   └── vehicles.module.ts
│   │
│   ├── auth/                               # Autenticación y Cuentas Multi-Workspace
│   │   ├── controllers/
│   │   │   └── auth.controller.ts          # Capa 1
│   │   ├── services/
│   │   │   └── auth.service.ts             # Capa 2: Verificación de hash pgcrypto
│   │   ├── repositories/
│   │   │   └── auth.repository.ts          # Capa 3: Búsqueda en public.users
│   │   ├── dto/
│   │   │   └── login.dto.ts
│   │   └── auth.module.ts
│   │
│   └── crm/                                # Backoffice Comercial, Planes SaaS y Gateways
│       ├── controllers/
│       │   └── crm.controller.ts           # Capa 1: Endpoints /crm/*
│       ├── services/
│       │   └── crm.service.ts              # Capa 2: Anti-bot, cálculo de MRR/ARR
│       ├── repositories/
│       │   └── crm.repository.ts           # Capa 3: Queries public.crm_* y public.saas_plans
│       ├── dto/
│       │   ├── create-prospect.dto.ts
│       │   └── update-plan.dto.ts
│       └── crm.module.ts
│
├── app.module.ts                           # Módulo raíz que importa los módulos de dominio
└── main.ts                                 # Bootstrap del servidor NestJS
```

---

## 📏 4. Reglas Operativas y Límites de Código

1. **Límite de Líneas por Archivo:**
   - Controladores: **< 150 líneas**.
   - Servicios: **< 200 líneas**.
   - Repositorios: **< 200 líneas**.
2. **DTOs Obligatorios:** Toda entrada de datos a un endpoint (`@Body()`, `@Query()`, `@Param()`) debe estar tipada con una clase DTO validada con `class-validator`.
3. **Inyección de Dependencias Limpia:**
   - Los controladores solo inyectan Servicios.
   - Los servicios inyectan Repositorios u otros Servicios.
   - Los repositorios inyectan `DatabaseService`.
4. **Respeto a las Rutas y Contratos Existentes:**
   - La refactorización modular debe mantener **100% idénticas** las URLs de la API (`/api/v1/tenants/:slug/properties`, `/api/v1/auth/login`, etc.) y las estructuras de respuesta JSON para garantizar compatibilidad total con los frontends.
