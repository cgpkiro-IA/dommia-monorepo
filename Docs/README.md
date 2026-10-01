# 📚 Documentación Oficial - DOMMIA

Índice central de la documentación técnica, arquitectónica y comercial del ecosistema **DOMMIA** (*El Sistema Operativo de tu Comunidad*).

> **Fuente de verdad del avance y alcance:** [Plan de Desarrollo Maestro por Fases](./Planes/Plan%20de%20Desarrollo%20Maestro%20por%20Fases.md). Para el MVP, SPEI requiere comprobante y validación manual del administrador, o se registra pago en efectivo. Stripe es opcional por entitlement y no es prioridad; la integración física de la Fase 5 está detenida hasta evaluar el hardware existente por caseta.

## 🧭 0. Índice de proyectos

El repositorio es un monorepo `pnpm` administrado con Turbo. Las aplicaciones viven en `apps/*` y los paquetes compartidos en `packages/*`.

### Aplicaciones

| Workspace | Responsabilidad | Tecnología / estructura | Desarrollo |
| --- | --- | --- | --- |
| [`@dommia/api`](../apps/api/package.json) | API principal y dominios de negocio | NestJS modular; `src/modules/` incluye auth, CRM, finanzas, residentes, accesos y notificaciones | `pnpm --filter @dommia/api dev` |
| [`@dommia/crm-admin`](../apps/crm-admin/package.json) | CRM maestro SaaS, pipeline comercial y gateways | Next.js; `src/features/` organiza dashboard, pipeline, gateways, planes y tenants | `pnpm --filter @dommia/crm-admin dev` · `localhost:3001` |
| [`@dommia/communities-admin`](../apps/communities-admin/package.json) | Administración operativa de comunidades | Next.js; features de propiedades, residentes, finanzas, guardias, avisos y notificaciones | `pnpm --filter @dommia/communities-admin dev` · `localhost:3002` |
| [`@dommia/portal-web`](../apps/portal-web/package.json) | Sitio y flujos web de captación | Next.js; features de landing, adquisición y calculadora | `pnpm --filter @dommia/portal-web dev` · `localhost:3000` |
| [`@dommia/resident-pwa`](../apps/resident-pwa/package.json) | Experiencia móvil del residente, con soporte offline | Next.js PWA; features de credenciales, finanzas, invitaciones y offline | `pnpm --filter @dommia/resident-pwa dev` · `localhost:3003` |
| [`@dommia/guard-pwa`](../apps/guard-pwa/package.json) | Validación de acceso para guardias | Next.js PWA; componentes de interfaz y lectura de códigos con ZXing | `pnpm --filter @dommia/guard-pwa dev` · `localhost:3004` |

### Paquetes compartidos

| Workspace | Uso |
| --- | --- |
| [`@dommia/shared-types`](../packages/shared-types/package.json) | Tipos compartidos entre aplicaciones y API |
| [`@dommia/ui`](../packages/ui/package.json) | Utilidades compartidas de interfaz |
| [`@dommia/config-tailwind`](../packages/config-tailwind/package.json) | Configuración Tailwind reutilizable |
| [`@dommia/config-typescript`](../packages/config-typescript/package.json) | Configuración TypeScript reutilizable |

### Comandos de raíz

- `pnpm dev`: inicia los workspaces con tarea `dev` mediante Turbo.
- `pnpm build`: construye los workspaces.
- `pnpm lint`: ejecuta lint donde esté configurado.
- `pnpm test`: ejecuta tests donde estén configurados.
- `pnpm docker:up` / `pnpm docker:down`: inicia o detiene los servicios locales definidos en Docker Compose.

Las decisiones y límites entre estos componentes se detallan en [Arquitectura](./Arquitectura/).

---

## 🏛️ 1. [Arquitectura](./Arquitectura/)
Documentos de referencia sobre la estructura del sistema, responsabilidades de capas y diseño técnico:
* **[Saas Modular Frac Arquitectura.md](./Arquitectura/Saas%20Modular%20Frac%20Arquitectura.md):** Arquitectura C4 (Contexto, Contenedores, Componentes), ADR-001 (Redis post-MVP), aislamiento multi-tenant por Schemas de PostgreSQL y principios rectores.
* **[Anexo A - Arquitectura.md](./Arquitectura/Anexo%20A%20-%20Arquitectura.md):** Guía de responsabilidades tecnológicas frontend y backend (React vs Next.js vs PWA vs Service Workers vs IndexedDB vs SQLite vs PostgreSQL).
* **[Conexion PostgreSQL y Multi-Tenancy.md](./Arquitectura/Conexion%20PostgreSQL%20y%20Multi-Tenancy.md):** Pool compartido, configuración parametrizada de `search_path`, transacciones, reglas SQL, migraciones/provisión y setup E2E actual.
* **[SaaS Modular Frac Recomendaciones.md](./Arquitectura/SaaS%20Modular%20Frac%20Recomendaciones.md):** Estrategia de triple plataforma (CRM Maestro, Portal Fraccionamiento e IoT Caseta), requerimientos de seguridad (MFA, RBAC, auditoría) y gobierno de datos.

---

## 🎨 2. [Marca & Diseño](./Marca/)
Lineamientos de identidad visual, directrices de comunicación y tono de voz:
* **[Saas Modular Frac Marca.md](./Marca/Saas%20Modular%20Frac%20Marca.md):** Manual de Marca corporativo de DOMMIA. Definición del ecosistema de 8 productos, paleta de colores (Midnight Blue `#0F172A`, Royal Blue `#2563EB`, etc.), tipografías (`Inter` y `Manrope`), isotipo (D + Hogar + Nodo Digital) y propuesta de valor comercial.

---

## 🗺️ 3. [Planes & Roadmap](./Planes/)
Planificación de ingeniería, seguimiento de entregables y roadmap de producción:
* **[Plan de Desarrollo Maestro por Fases.md](./Planes/Plan%20de%20Desarrollo%20Maestro%20por%20Fases.md):** **(Documento Vivo Principal)** Bitácora de versiones, roadmap, estado E2E y jerarquía de documentos normativos.
* **[Desarrollo app Android.md](./Planes/Desarrollo%20app%20Android.md):** Estado y decisiones específicas Android. Para rutas, DTOs, auth, permisos y errores rige el contrato Mobile común.
* **[Desarrollo app iOS.md](./Planes/Desarrollo%20app%20iOS.md):** Estado y decisiones específicas iOS. Para rutas, DTOs, auth, permisos y errores rige el contrato Mobile común.
	El scaffold inicial vive en [`apps/resident-ios`](../apps/resident-ios/README.md).
* **[Contrato Resident Mobile v1.md](./Planes/Contrato%20Resident%20Mobile%20v1.md):** **Fuente normativa única** para integración Android/iOS con el backend: autenticación, sesiones, rutas, DTOs, aislamiento, errores y bloqueos PROD.
* **[PT Autenticación Segura Multiplataforma.md](./Planes/PT%20Autenticacion%20Segura%20Multiplataforma.md):** Registro del estado de implementación, E2E y gates de producción; no sustituye el contrato Mobile.
* **[PT Rendición Financiera Mensual.md](./Planes/PT%20Rendicion%20Financiera%20Mensual.md):** Contrato funcional/técnico de ingresos, egresos, conciliación, evidencias privadas GCS, publicación y lectura Resident opcional.
* **[SaaS Modular Frac Plan Maestro.md](./Planes/SaaS%20Modular%20Frac%20Plan%20Maestro.md):** Documento histórico de referencia; sus propuestas de IoT/Wiegand no son alcance vigente del MVP.

---

## 📘 4. Manual de operación
* Consulta [Manual DOMMIA para principiantes](./Manual/Manual%20DOMMIA%20para%20principiantes.md) para el recorrido desde contratación y aprovisionamiento hasta la configuración de Communities, Guard y Resident, con los límites conocidos del flujo actual.

## 🧪 5. Guía de Pruebas & Operación
* Consulta la carpeta **[`/Testing`](../Testing/)** para comandos verificados, precondiciones E2E, migraciones requeridas y brechas de validación local/staging/dispositivos.
* Consulta [Despliegue GCP Producción](./Despliegue%20GCP%20Produccion.md) para configuración Cloud Run/Cloud SQL, bootstrap de una base vacía y auditoría de esquema.
