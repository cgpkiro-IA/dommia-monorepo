# Guía de Capas Frontend y Responsabilidades Tecnológicas

## Propósito

Este documento explica cómo interactúan las tecnologías frontend seleccionadas para el SaaS Modular para Fraccionamientos.

Su objetivo es servir como referencia para desarrolladores humanos y agentes de IA, evitando confusiones sobre las responsabilidades de cada capa.

---

# Visión General

El frontend NO está compuesto por tecnologías independientes.

Cada tecnología pertenece a una capa específica de la arquitectura:

NextJS
└── React
    └── PWA
        ├── Service Workers
        └── IndexedDB

Cada capa resuelve un problema distinto.

---

# Capa 1: React

## Responsabilidad

Construcción de interfaces de usuario.

## Qué desarrolla React

- Formularios
- Tablas
- Dashboards
- Modales
- Catálogos
- Reportes
- Componentes reutilizables

## Ejemplos en el proyecto

- Alta de residente
- Registro de propiedades
- Estado de cuenta
- Invitaciones
- Historial de accesos
- Dashboard financiero

## Qué NO hace React

- Routing avanzado
- Renderizado del servidor
- SEO
- Persistencia offline

---

# Capa 2: NextJS

## Responsabilidad

Framework principal del frontend.

## Qué aporta

### Enrutamiento

/admin
/residentes
/finanzas
/accesos
/crm

### Middleware

- Autenticación
- Roles
- Multi Tenant
- Redirecciones

### Renderizado

- SSR
- SSG
- CSR

### SEO

Importante para:

- Landing comercial
- Marketing
- Captación de clientes

## Qué NO hace NextJS

- Persistencia offline
- Base de datos local

---

# Capa 3: PWA

## Responsabilidad

Convertir la aplicación web en una experiencia similar a una App.

## Funcionalidades

- Instalación en dispositivo
- Pantalla completa
- Icono propio
- Acceso rápido
- Experiencia móvil mejorada

## Casos de uso

### Residentes

- Invitaciones
- QR dinámico
- Pagos
- Avisos

### Guardias

- Bitácora
- Control de accesos
- Eventos en tiempo real

## Qué NO hace una PWA

- Almacenamiento local
- Caché offline

Estas funciones pertenecen a otras capas.

---

# Capa 4: Service Workers

## Responsabilidad

Administrar el funcionamiento offline del frontend.

## Funciones

### Caché de recursos

- HTML
- CSS
- JavaScript
- Imágenes
- Fuentes

### Inicio sin conexión

Permite abrir la aplicación incluso cuando el usuario no tiene Internet.

### Sincronización posterior

Cuando la conexión regresa:

- Sincronizar cambios
- Refrescar datos
- Actualizar contenido

## Caso de uso real

Residente sin señal celular en la entrada del fraccionamiento.

- La PWA abre correctamente.
- La interfaz continúa funcionando.

---

# Capa 5: IndexedDB

## Responsabilidad

Base de datos local del navegador.

## Información que puede almacenar

### Residentes

- Perfil
- Configuración
- Invitaciones vigentes
- Datos temporales
- Preferencias

### Operación Offline

- Invitaciones recientes
- QR vigentes
- Caché funcional

## Información que NO debe almacenar como fuente oficial

- Pagos oficiales
- Estados de cuenta oficiales
- Saldos oficiales
- Configuración maestra
- Auditoría

La fuente de verdad siempre será PostgreSQL.

---

# Flujo Completo de Ejemplo

## Creación de Invitación

Usuario
↓
React
↓
NextJS
↓
NestJS API
↓
PostgreSQL

Invitación creada
↓
IndexedDB

Copia local disponible

---

## Consulta sin Internet

Usuario
↓
Abre PWA
↓
Service Worker
↓
IndexedDB
↓
Invitación mostrada

Sin conexión con el servidor.

---

# Relación con la Arquitectura General

## Frontend

- NextJS
- React
- PWA
- Service Workers
- IndexedDB

## Backend

- NestJS
- PostgreSQL

## IoT

- MQTT
- Gateway
- SQLite

---

# Diferencia entre IndexedDB, SQLite y PostgreSQL

## IndexedDB

Ubicación:
- Navegador

Propósito:
- Operación offline del residente.

## SQLite

Ubicación:
- Gateway de caseta.

Propósito:
- Operación offline física.

## PostgreSQL

Ubicación:
- Nube.

Propósito:
- Fuente oficial de información.

---

# Decisión Arquitectónica Oficial

Frontend:
- React = Interfaz.
- NextJS = Framework.
- PWA = Experiencia App.
- Service Worker = Caché y operación offline.
- IndexedDB = Persistencia local.

Backend:
- NestJS = Lógica de negocio.
- PostgreSQL = Fuente oficial de datos.

Casetas:
- SQLite = Operación offline.
- MQTT = Comunicación con la nube.

Esta separación de responsabilidades debe mantenerse durante toda la evolución del proyecto para garantizar escalabilidad y consistencia arquitectónica.
