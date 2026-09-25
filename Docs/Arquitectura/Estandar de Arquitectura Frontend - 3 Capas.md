# 📐 Estándar de Arquitectura Frontend — Separación en 3 Capas & Feature-Driven Design

**Proyecto:** DOMMIA SaaS Ecosystem  
**Fecha de Publicación:** 2026-09-24  
**Ámbito de Aplicación:** Todos los proyectos frontend (`apps/portal-web`, `apps/crm-admin`, `apps/communities-admin`, `apps/resident-pwa`, `packages/ui`).

---

## 🎯 1. Objetivo y Justificación

Para evitar la degradación del código, la acumulación desmedida de líneas en archivos monolíticos (`page.tsx` de más de 500 líneas) y el acoplamiento entre la lógica de negocio y la interfaz de usuario, se establece de forma obligatoria la **Arquitectura en 3 Capas por Features**.

### Regla de Oro:
> **Ningún archivo de componente visual debe superar las 250 líneas.** Si un componente o página excede este tamaño, debe descomponerse en subcomponentes de presentación y sus estados deben delegarse a custom hooks independientes.

---

## 🏛️ 2. Las Tres Capas de la Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CAPA DE PRESENTACIÓN (UI / TSX)                          │
│    • Componentes "tontos" (Presentational / Dumb Components)│
│    • Cero useEffect, cero llamadas directas a fetch/axios   │
│    • Solo recibe props tipadas y renderiza JSX accesible    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Consume
┌──────────────────────────────▼──────────────────────────────┐
│ 2. CAPA DE LÓGICA DE NEGOCIO & ESTADO (Custom Hooks / TS)   │
│    • use[Feature].ts, useAuth.ts, useProperties.ts          │
│    • useState, useEffect, useMemo, useCallback              │
│    • Handlers (handleSubmit, handleDelete, handleToggle)     │
│    • Consumo de API REST, validaciones y transformaciones   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Estiliza
┌──────────────────────────────▼──────────────────────────────┐
│ 3. CAPA DE ESTILOS & TOKENS DE DISEÑO                       │
│    • Utility-First Tailwind CSS estandarizado               │
│    • Tokens de diseño compartidos desde @dommia/ui          │
│    • Clases declarativas sin contaminar el flujo lógico     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 3. Estructura de Directorios Estandarizada

Cada aplicación frontend debe seguir la estructura organizada por dominios funcionales (**Features**):

```
src/
├── types/                           # Modelos de datos e interfaces TypeScript compartidas
│   └── index.ts                     # Interfaces de entidades (Property, Resident, Tenant, etc.)
│
├── features/                        # Módulos funcionales del sistema
│   ├── auth/                        # Dominio de Autenticación
│   │   ├── components/              # Subcomponentes visuales exclusivos
│   │   │   ├── LoginForm.tsx        # Solo formulario y estilos visuales
│   │   │   └── WorkspacePicker.tsx  # Selector de fraccionamientos para admins multi-tenant
│   │   └── hooks/                   # Lógica y estado
│   │       └── useAuth.ts           # Manejo de sesión, login API, switch de tenant
│   │
│   ├── properties/                  # Dominio de Catálogo de Viviendas
│   │   ├── components/
│   │   │   ├── PropertiesTable.tsx  # Tabla y filtros de viviendas
│   │   │   ├── AddPropertyModal.tsx # Modal de alta de propiedad
│   │   │   ├── EditPropertyModal.tsx# Modal de edición (Switch Verde/Rojo)
│   │   │   └── UpgradeModal.tsx     # Modal de límite duro alcanzado
│   │   └── hooks/
│   │       └── useProperties.ts     # CRUD de propiedades, filtros y métricas
│   │
│   ├── residents/                   # Dominio de Padrón de Residentes
│   │   ├── components/
│   │   │   ├── ResidentsTable.tsx   # Tabla con badges de rol, contacto y WhatsApp
│   │   │   └── ResidentModal.tsx    # Modal de alta y edición de residente
│   │   └── hooks/
│   │       └── useResidents.ts      # CRUD de habitantes, clasificación de roles
│   │
│   ├── vehicles/                    # Dominio de Control Vehicular
│   │   ├── components/
│   │   │   ├── VehiclesTable.tsx    # Tarjetas de placas mexicanas estilizadas
│   │   │   └── VehicleModal.tsx     # Modal de alta y edición de vehículo
│   │   └── hooks/
│   │       └── useVehicles.ts       # CRUD de vehículos y asociación a vivienda
│   │
│   └── dashboard/                   # Componentes transversales del Dashboard
│       └── components/
│           ├── TopNavbar.tsx        # Barra superior con selector de comunidad
│           ├── CapacityHeroBanner.tsx # Indicador visual de cupo y límite contratado
│           ├── StatsMetricsGrid.tsx # Tarjetas métricas interactivas
│           └── TabNavigation.tsx    # Navegación segmentada entre pestañas
│
└── app/
    └── page.tsx                     # Orquestador raíz limpio (< 150 líneas)
```

---

## 📋 4. Responsabilidades Específicas por Capa

### 1. Capa de Presentación (`components/*.tsx`):
* **Comportamiento:** Solo recibe datos mediante `interface Props`.
* **Prohibido:**
  * ❌ No debe ejecutar llamadas a `fetch()`, `axios` o librerías de red.
  * ❌ No debe definir estados globales ni lógica compleja de negocio.
* **Permitido:**
  * ✅ Recibir callbacks: `onSave`, `onDelete`, `onFilterChange`, `onClose`.
  * ✅ Pequeños estados puramente efímeros de UI (ej. toggle de un menú contextual abierto/cerrado).

### 2. Capa de Lógica (`hooks/*.ts`):
* **Comportamiento:** Exporta un Custom Hook que concentra el ciclo de vida, llamadas asíncronas y transformaciones.
* **Retorno:** Un objeto limpio con estados listos para consumir y handlers preparados:
  ```typescript
  return {
    items,
    filteredItems,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    handleCreate,
    handleUpdate,
    handleDelete,
  };
  ```

### 3. Capa de Estilos:
* Utilizar Tailwind CSS con la paleta oficial de DOMMIA:
  * Brand: `blue-600`, `indigo-500`, `slate-900`.
  * Estatus positivo / Al corriente: `emerald-500`, `emerald-50`, `emerald-700`.
  * Estatus de alerta / Moroso / Bloqueo: `red-600`, `red-50`, `red-700`.
  * Advertencia / Cupo próximo: `amber-500`, `amber-50`.

---

## 🚀 5. Beneficios para el Monorepo
1. **Mantenibilidad Inmediata:** Si se requiere ajustar una llamada a la API o un endpoint, solo se toca el hook `use[Feature].ts`. Si se requiere ajustar el diseño visual o un color, solo se toca el componente visual.
2. **Reutilización:** Los componentes visuales pueden trasladarse fácilmente a `@dommia/ui` o compartirse entre proyectos.
3. **Testabilidad:** Los custom hooks pueden someterse a pruebas unitarias puras sin necesidad de renderizar el DOM completo.
4. **Legibilidad:** El archivo principal `page.tsx` se lee como un índice ejecutivo o guión de orquestación en menos de 150 líneas.
