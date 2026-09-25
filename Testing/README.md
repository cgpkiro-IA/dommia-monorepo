# 🧪 Guía Operativa de Testing y Servicios - DOMMIA
**Proyecto:** SaaS Modular para Fraccionamientos (DOMMIA)  
**Versión:** 1.0.0  
**Fecha:** 2026-09-24  
**Propósito:** Servir como manual rápido y de referencia para cualquier desarrollador o agente que necesite levantar, reiniciar, probar o simular flujos en el ecosistema DOMMIA.

---

## 🌐 1. Mapa de Servicios y Puertos Locales

| Servicio | Tecnología | Puerto | URL / Conexión | Propósito |
| :--- | :--- | :---: | :--- | :--- |
| **PostgreSQL 16** | Docker Container (`dommia_postgres`) | `5432` | `postgresql://dommia_admin:dommia_secret_2026@localhost:5432/dommia_master` | Base de datos principal con aislamiento multi-tenant por schemas. |
| **EMQX Broker MQTT** | Docker Container (`dommia_emqx`) | `1883` / `8883` | `mqtt://localhost:1883` (TCP) / `mqtts://localhost:8883` (SSL) | Broker de mensajería para telemetría y sincronización de casetas IoT. |
| **EMQX Dashboard** | Web UI de EMQX | `18083` | [http://localhost:18083](http://localhost:18083) | Monitoreo de clientes MQTT, tópicos, mensajes y métricas IoT. |
| **Dommia Core API** | NestJS Monolito Modular (`apps/api`) | `4000` | [http://localhost:4000/api/v1](http://localhost:4000/api/v1) | Backend central con conmutación dinámica de esquema (`search_path`). |
| **Dommia Portal Web** | Next.js 15 (`apps/portal-web`) | `3000` | [http://localhost:3000](http://localhost:3000) | Landing comercial oficial, cotizador dinámico de Tiers y captación de leads conectada al CRM. |
| **Dommia CRM** | Next.js 15 (`apps/crm-admin`) | `3001` | [http://localhost:3001](http://localhost:3001) | Backoffice del operador SaaS: métricas ejecutivas, altas de fraccionamientos, catálogo dinámico de planes y salud de gateways. |
| **Dommia Communities** | Next.js 15 (`apps/communities-admin`) | `3002` | [http://localhost:3002](http://localhost:3002) | Portal operativo del fraccionamiento (para `TENANT_ADMIN`): catálogo de viviendas con bloqueo de límite duro, residentes y tesorería. |

---

## ⚡ 2. Comandos Operativos para Levantar o Reiniciar Servicios

### A. Control de Contenedores Docker (Base de Datos & MQTT)
```bash
# 1. Levantar servicios en segundo plano
docker compose up -d

# 2. Verificar estado de salud de los contenedores
docker ps

# 3. Ver logs en tiempo real de PostgreSQL o EMQX
docker compose logs -f postgres
docker compose logs -f emqx

# 4. Detener los servicios
docker compose down

# 5. Reiniciar completamente limpiando datos (si se requiere reiniciar desde cero)
docker compose down -v && docker compose up -d
```

### B. Ejecución de Aplicaciones con Turborepo & pnpm
```bash
# 1. Instalar dependencias en todo el monorepo
pnpm install

# 2. Compilar todos los paquetes compartidos (@dommia/shared-types, @dommia/ui)
pnpm --filter @dommia/shared-types build
pnpm --filter @dommia/ui build

# 3. Levantar el Backend Core API (NestJS) en modo desarrollo con recarga automática:
pnpm --filter @dommia/api dev

# 4. Levantar el Frontend Dommia CRM (Next.js) en modo desarrollo:
pnpm --filter @dommia/crm-admin dev

# 5. Levantar todo el ecosistema en paralelo con Turborepo:
pnpm dev
```

---

## 👥 3. Catálogo de Usuarios Demo para Pruebas

Todos los usuarios de prueba ya se encuentran pre-sembrados en la base de datos local:

### A. Nivel Global SaaS (Esquema `public.users`)
Acceso mediante **Dommia CRM** ([http://localhost:3001](http://localhost:3001)):

| Rol | Correo Electrónico | Contraseña | Nombre / Descripción |
| :--- | :--- | :--- | :--- |
| **SUPER_ADMIN** | `superadmin@dommia.com` | `DommiaPassword2026!` | Carlos Administrador Global (Acceso total al CRM, suscripciones y configuración). |
| **COMMERCIAL_EXEC** | `ventas@dommia.com` | `DommiaPassword2026!` | Mariana Ejecutiva (Acceso a prospectos, cotizador y pipeline comercial). |
| **SUPPORT** | `soporte@dommia.com` | `DommiaPassword2026!` | Alejandro Soporte (Tickets de soporte y monitoreo de gateways). |

---

### B. Nivel Fraccionamiento Demo (`Fraccionamiento Residencial Las Palmas`)
* **Slug / Subdominio:** `demo` (`demo.dommia.com`)
* **Esquema PostgreSQL:** `tenant_demo`
* **Límite contratado:** 150 viviendas (Tier `PROFESSIONAL`)

| Rol | Correo Electrónico | Contraseña | Propiedad / Contexto |
| :--- | :--- | :--- | :--- |
| **TENANT_ADMIN** | `admin@laspalmas.dommia.com` | `LasPalmas2026!` | Administrador oficial de Las Palmas. Gestiona residentes, casas y finanzas. |
| **GUARD** | `guardia@laspalmas.dommia.com` | `Guardia2026!` | Personal de vigilancia en Caseta Principal Norte. Monitorea accesos y valida QR. |
| **RESIDENT (Al corriente)** | `carlos.mendoza@gmail.com` | `Residente2026!` | **Paseo de los Olivos 101**. Propietario al corriente con TAG activo e invitaciones vigentes. |
| **RESIDENT (Familiar)** | `elena.mendoza@gmail.com` | `Residente2026!` | **Paseo de los Olivos 101**. Residente secundaria. |
| **RESIDENT (Moroso)** | `roberto.garza@gmail.com` | `Residente2026!` | **Paseo de los Olivos 102**. Propietario con 3 meses de adeudo (para probar bloqueos de acceso). |

---

## 🚗 4. Hardware Simulado & Datos de Accesos IoT

### A. Credenciales del Broker EMQX (Dashboard Web)
* **URL:** [http://localhost:18083](http://localhost:18083)
* **Usuario:** `dommia_admin`
* **Contraseña:** `dommia_mqtt_pass_2026`

### B. Dispositivo Gateway de Caseta Demo
* **UUID del Gateway:** `gw-caseta-norte-laspalmas-01`
* **Nombre:** Gateway Caseta Principal Norte
* **Tópico MQTT de Sincronización:** `dommia/tenants/demo/sync`
* **Tópico MQTT de Telemetría/Heartbeats:** `dommia/gateways/gw-caseta-norte-laspalmas-01/heartbeat`

### C. TAGs RFID Vehiculares Preconfigurados
* **`TAG-UHF-8821` (Vehicular Autorizado):**
  * Vehículo: Mazda CX-5 (Placas `NXX-4521`).
  * Propiedad: Paseo de los Olivos 101 (Al corriente).
  * **Resultado Esperado en Caseta:** Apertura inmediata de pluma (`is_granted = true`).
* **`TAG-UHF-9932` (Vehicular Restringido por Adeudo):**
  * Vehículo: BMW Serie 3 (Placas `YZT-8842`).
  * Propiedad: Paseo de los Olivos 102 (Moroso con 3 cuotas pendientes).
  * **Resultado Esperado en Caseta:** Pluma cerrada + Alerta visual/auditiva de morosidad en pantalla del guardia (`is_granted = false`, motivo: `PROPERTY_DELINQUENT`).

### D. Semilla TOTP para QR Dinámico de Invitación
* **Invitado Demo:** Alejandro Visita Familiar
* **Semilla Base32 TOTP:** `JBSWY3DPEHPK3PXP`
* **Algoritmo:** HMAC-SHA1 rotando cada 15 segundos.

---

## 🛠️ 5. Pruebas de API con `curl`

### Health Check de Servicios
```bash
curl -s http://localhost:4000/api/v1/health | jq .
```

### Consultar Lista de Fraccionamientos Activos
```bash
curl -s http://localhost:4000/api/v1/tenants | jq .
```

### Aprovisionar Dinámicamente un Nuevo Fraccionamiento
```bash
curl -s -X POST http://localhost:4000/api/v1/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "bosque_real",
    "name": "Residencial Bosque Real",
    "tier": "STANDARD",
    "maxProperties": 120,
    "contactEmail": "contacto@bosquereal.com"
  }' | jq .
```

### Consultar Propiedades de un Tenant (Aislamiento por Schema)
```bash
# Propiedades de Las Palmas (demo):
curl -s http://localhost:4000/api/v1/tenants/demo/properties | jq .

# Propiedades del nuevo fraccionamiento (bosque_real):
curl -s http://localhost:4000/api/v1/tenants/bosque_real/properties | jq .
```

### Registrar una Propiedad Validando Límites Duros
```bash
curl -s -X POST http://localhost:4000/api/v1/tenants/demo/properties \
  -H "Content-Type: application/json" \
  -d '{
    "street": "Avenida Las Palmas",
    "exteriorNumber": "500",
    "block": "Manzana 10",
    "lot": "Lote 1"
  }' | jq .
```

### Consultar Prospectos Comerciales (Pipeline CRM)
```bash
curl -s http://localhost:4000/api/v1/crm/prospects | jq .
```

### Registrar un Prospecto desde Landing Page o API (Solicitud de Demostración Segura)
```bash
curl -s -X POST http://localhost:4000/api/v1/crm/prospects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ing. Fernando Silva",
    "email": "fsilva@haciendareal.com",
    "phone": "+52 33 1122 3344",
    "communityName": "Hacienda Real Residencial",
    "estimatedHouses": 140,
    "notes": "Interesado en Plan Estándar con códigos QR Dinámicos"
  }' | jq .
```

### Probar Blindaje Anti-Bot y Anti-Scraping (Honeypot & Disposable Email)
```bash
# 1. Prueba de trampa Honeypot (Scraper que llena campos ocultos):
curl -s -X POST http://localhost:4000/api/v1/crm/prospects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Scraper Bot",
    "email": "bot@scraper.org",
    "communityName": "Bot Condo",
    "honeypot": "trap_triggered"
  }' | jq .
# Resultado: Se descarta silenciosamente con ID mock sin contaminar la BD.

# 2. Prueba de rechazo de correo temporal/desechable:
curl -s -X POST http://localhost:4000/api/v1/crm/prospects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Attacker",
    "email": "attacker@tempmail.com",
    "communityName": "Fake Fracc"
  }' | jq .
# Resultado: HTTP 400 Bad Request ("Por favor proporciona un correo legítimo...")
```

### Probar Contratación Inmediata (Self-Service Zero-Touch Provisioning)
```bash
# 1. Contratación estándar (sin add-on de dominio -> standar.dommia.com/san_marino):
curl -s -X POST http://localhost:4000/api/v1/crm/self-service-provision \
  -H "Content-Type: application/json" \
  -d '{
    "communityName": "Privada San Marino",
    "slug": "san_marino",
    "adminName": "David Álvarez",
    "adminEmail": "dalvarez@sanmarino.com",
    "adminPassword": "PasswordSanMarino2026!",
    "tier": "STANDARD",
    "maxProperties": 95,
    "hasCustomDomain": false
  }'

# 2. Contratación con Add-on de Subdominio Personalizado (+ $490 MXN/mes -> arboledas_sur.dommia.com):
curl -s -X POST http://localhost:4000/api/v1/crm/self-service-provision \
  -H "Content-Type: application/json" \
  -d '{
    "communityName": "Residencial Arboledas del Sur",
    "slug": "arboledas_sur",
    "adminName": "Roberto Morales",
    "adminEmail": "rmorales@arboledas.com",
    "adminPassword": "PasswordArboledas2026!",
    "tier": "STANDARD",
    "maxProperties": 100,
    "hasCustomDomain": true
  }'
```

### Probar Gestión Dinámica de Planes y Módulos (CRM Maestro)
```bash
# 1. Consultar catálogo de planes y precios vigentes:
curl -s http://localhost:4000/api/v1/crm/plans

# 2. Modificar precio y tope de viviendas de un plan (ej. Plan Estándar):
curl -s -X PUT http://localhost:4000/api/v1/crm/plans/<PLAN_UUID> \
  -H "Content-Type: application/json" \
  -d '{
    "monthlyPrice": 2990,
    "maxProperties": 100,
    "customDomainAddonPrice": 490,
    "description": "El equilibrio perfecto para fraccionamientos medianos."
  }'
### Probar Dommia Communities y Bloqueo de Límite Duro (Fase 2)
```bash
# 1. Autenticación de Administrador de Fraccionamiento (TENANT_ADMIN):
curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@laspalmas.dommia.com",
    "password": "LasPalmas2026!"
  }'

# 2. Consultar catálogo de propiedades y métricas de capacidad:
curl -s http://localhost:4000/api/v1/tenants/demo/properties

# 3. Registrar una nueva vivienda en el fraccionamiento:
curl -s -X POST http://localhost:4000/api/v1/tenants/demo/properties \
  -H "Content-Type: application/json" \
  -d '{
    "street": "Paseo de los Olivos",
    "exteriorNumber": "105",
    "block": "Manzana 3",
    "lot": "Lote 18",
    "notes": "Casa familiar"
  }'

# 4. Probar Bloqueo de Límite Duro (Intento de rebasar capacidad contratada):
# Si el plan permite 2 casas y ya existen 2, el backend responde con 409/403 LIMIT_EXCEEDED:
# {"code":"LIMIT_EXCEEDED","message":"Límite de propiedades alcanzado: Tu plan BASIC permite un máximo de 2 viviendas. Para registrar más propiedades, actualiza a un plan superior (Upgrade)."}
```

---

## 🌐 6. Acceso Directo a los Portales Web en Desarrollo
* **Dommia API Core (NestJS + Swagger/Health):** [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)
* **Landing Comercial DOMMIA (Sitio Oficial + Cotizador + Auto-Activación):** [http://localhost:3000](http://localhost:3000)
* **Dommia CRM (Backoffice Operador SaaS + Tab Planes & Módulos):** [http://localhost:3001](http://localhost:3001)
* **Dommia Communities (Portal Operativo del Fraccionamiento):** [http://localhost:3002](http://localhost:3002) *(o con parámetro `?tenant=demo`)*
* **Dommia Resident (PWA Móvil de Colonos & Credencial TOTP):** [http://localhost:3003](http://localhost:3003)
* **EMQX IoT Dashboard:** [http://localhost:18083](http://localhost:18083)


