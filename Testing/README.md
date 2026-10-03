# 🧪 Guía Operativa de Testing y Servicios - DOMMIA
**Proyecto:** SaaS Modular para Fraccionamientos (DOMMIA)  
**Versión:** 1.7.0
**Fecha:** 2026-09-30
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
| **Dommia Guard** | Next.js PWA (`apps/guard-pwa`) | `3004` | [http://localhost:3004](http://localhost:3004) | Validación QR en línea, consulta de residentes/placas, paquetería, incidencias e historial de caseta. |

---

## ⚡ 2. Comandos Operativos para Levantar o Reiniciar Servicios

La persistencia/API y las migraciones se describen en [Conexión PostgreSQL y Multi-Tenancy](../Docs/Arquitectura/Conexion%20PostgreSQL%20y%20Multi-Tenancy.md). La base PostgreSQL y el API deben estar disponibles antes de ejecutar E2E. Las pruebas no hacen `docker compose down -v`, no borran schemas tenant y no deben apuntar a producción.

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

# 5. DESTRUCTIVO: elimina todos los volúmenes y datos locales (solo si se requiere reiniciar desde cero)
docker compose down -v && docker compose up -d
```

No ejecutes el paso 5 para un reinicio normal. `-v` elimina permanentemente los datos locales de PostgreSQL y EMQX.

### B. Ejecución de Aplicaciones con Turborepo & pnpm

El monorepo fija la versión de pnpm en el `package.json` raíz. Usa Corepack para ejecutarla, especialmente en Windows o cuando `pnpm` no está disponible directamente en `PATH`.

```bash
# 1. Instalar dependencias en todo el monorepo
corepack pnpm install

# 2. Levantar PostgreSQL local (requerido por el API)
docker compose up -d postgres

# 3. Compilar los tipos compartidos usados por el API
corepack pnpm --filter @dommia/shared-types build

# 4. Levantar el Backend Core API (NestJS) en modo desarrollo con recarga automática:
corepack pnpm --filter @dommia/api dev
```

NestJS carga `apps/api/.env.local` (o `apps/api/.env`). Si aún no tienes uno, copia `apps/api/.env.example` a `apps/api/.env.local` y reemplaza los placeholders; no subas ese archivo al repositorio. Para confirmar que el backend quedó disponible, abre `http://localhost:4000/api/v1/health` en otra terminal o navegador.

```bash
# 5. Levantar el Frontend Dommia CRM (Next.js) en modo desarrollo:
corepack pnpm --filter @dommia/crm-admin dev

# 6. Levantar todo el ecosistema en paralelo con Turborepo:
corepack pnpm dev
```

---

## 👥 3. Catálogo de Usuarios Demo para Pruebas

Todos los usuarios de prueba ya se encuentran pre-sembrados en la base de datos local:

### A. Nivel Global SaaS (Esquema `public.users`)
Acceso mediante **Dommia CRM** ([http://localhost:3001](http://localhost:3001)):

| Rol | Correo Electrónico | Contraseña | Nombre / Descripción |
| :--- | :--- | :--- | :--- |
| **SUPER_ADMIN** | `superadmin@dommia.com.mx` | `DommiaPassword2026!` | Carlos Administrador Global (Acceso total al CRM, suscripciones y configuración). |
| **COMMERCIAL_EXEC** | `ventas@dommia.com.mx` | `DommiaPassword2026!` | Mariana Ejecutiva (Acceso a prospectos, cotizador y pipeline comercial). |
| **SUPPORT** | `soporte@dommia.com.mx` | `DommiaPassword2026!` | Alejandro Soporte (Tickets de soporte y monitoreo de gateways). |

---

### B. Nivel Fraccionamiento Demo (`Fraccionamiento Residencial Las Palmas`)
* **Slug / Subdominio:** `demo` (`demo.dommia.com.mx`)
* **Esquema PostgreSQL:** `tenant_demo`
* **Límite contratado:** 150 viviendas (Tier `PROFESSIONAL`)

| Rol | Correo Electrónico | Contraseña | Propiedad / Contexto |
| :--- | :--- | :--- | :--- |
| **TENANT_ADMIN** | `admin@laspalmas.dommia.com.mx` | `LasPalmas2026!` | Administrador oficial de Las Palmas. Gestiona residentes, casas y finanzas. |
| **GUARD** | `guardia@laspalmas.dommia.com.mx` | `Guardia2026!` | Personal de vigilancia en Caseta Principal Norte. Monitorea accesos y valida QR. |
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

Las rutas administrativas están protegidas. Obtén una sesión para cada rol que corresponda; si MFA está habilitado, el login devuelve un desafío sin token de sesión y primero hay que completar `/auth/mfa/verify`.

```bash
CRM_LOGIN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@dommia.com.mx","password":"DommiaPassword2026!"}')
export CRM_TOKEN=$(echo "$CRM_LOGIN" | jq -r '.data.token')
```

El token de `TENANT_ADMIN` se obtiene con el login de la sección Communities más abajo. No reutilices estos usuarios/contraseñas fuera de desarrollo.

### Health Check de Servicios
```bash
curl -s http://localhost:4000/api/v1/health | jq .
```

### Consultar Lista de Fraccionamientos Activos
```bash
# Requiere sesión CRM (rol SUPER_ADMIN, COMMERCIAL_EXEC o SUPPORT).
curl -s http://localhost:4000/api/v1/tenants \
  -H "Authorization: Bearer $CRM_TOKEN" | jq .
```

### Aprovisionar Dinámicamente un Nuevo Fraccionamiento
```bash
curl -s -X POST http://localhost:4000/api/v1/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CRM_TOKEN" \
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
curl -s http://localhost:4000/api/v1/tenants/demo/properties \
  -H "Authorization: Bearer $TENANT_TOKEN" | jq .

# Propiedades del nuevo fraccionamiento (bosque_real):
curl -s http://localhost:4000/api/v1/tenants/bosque_real/properties \
  -H "Authorization: Bearer $TENANT_TOKEN" | jq .
```

### Registrar una Propiedad Validando Límites Duros
```bash
curl -s -X POST http://localhost:4000/api/v1/tenants/demo/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TENANT_TOKEN" \
  -d '{
    "street": "Avenida Las Palmas",
    "exteriorNumber": "500",
    "block": "Manzana 10",
    "lot": "Lote 1"
  }' | jq .
```

### Consultar Prospectos Comerciales (Pipeline CRM)
```bash
curl -s http://localhost:4000/api/v1/crm/prospects \
  -H "Authorization: Bearer $CRM_TOKEN" | jq .
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
# 1. Contratación estándar (sin add-on de dominio -> standar.dommia.com.mx/san_marino):
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

# 2. Contratación con Add-on de Subdominio Personalizado (+ $490 MXN/mes -> arboledas_sur.dommia.com.mx):
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
curl -s http://localhost:4000/api/v1/crm/plans \
  -H "Authorization: Bearer $CRM_TOKEN"

# 2. Modificar precio y tope de viviendas de un plan (ej. Plan Estándar):
curl -s -X PUT http://localhost:4000/api/v1/crm/plans/<PLAN_UUID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CRM_TOKEN" \
  -d '{
    "monthlyPrice": 2990,
    "maxProperties": 100,
    "customDomainAddonPrice": 490,
    "description": "El equilibrio perfecto para fraccionamientos medianos."
  }'
### Probar Dommia Communities y Bloqueo de Límite Duro (Fase 2)
```bash
# 1. Autenticación de Administrador de Fraccionamiento (TENANT_ADMIN):
TENANT_LOGIN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@laspalmas.dommia.com.mx",
    "password": "LasPalmas2026!"
  }')
export TENANT_TOKEN=$(echo "$TENANT_LOGIN" | jq -r '.data.token')

# Si data.mfaRequired es true, completar POST /api/v1/auth/mfa/verify con
# challengeToken y el código de seis dígitos antes de usar la sesión.

# 2. Consultar catálogo de propiedades y métricas de capacidad:
curl -s http://localhost:4000/api/v1/tenants/demo/properties \
  -H "Authorization: Bearer $TENANT_TOKEN"

# 3. Registrar una nueva vivienda en el fraccionamiento:
curl -s -X POST http://localhost:4000/api/v1/tenants/demo/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TENANT_TOKEN" \
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
* **Dommia Guard (PWA de caseta):** [http://localhost:3004](http://localhost:3004)
* **EMQX IoT Dashboard:** [http://localhost:18083](http://localhost:18083)

---

## 🛡️ 7. Validación P1 de Dommia Guard

### Smoke test funcional en local
1. Levanta PostgreSQL/EMQX, API, Communities y Guard.
2. En Communities, abre **Guardias** y agrega temporalmente una placa a **Lista de bloqueo** o **Visita frecuente**. Busca esa placa en Guard y verifica clasificación, motivo y estado; retira la clasificación al terminar.
3. Desde Guard, reporta una incidencia de prioridad alta. En Communities, actualiza **Operación y alertas**, confirma tipo, prioridad, ubicación, guardia y hora; márcala resuelta y verifica que deje de aparecer en pendientes.
4. En Guard, filtra el historial por tipo, fechas y texto de domicilio; confirma orden descendente y que los eventos de acceso, recepción/retiro de paquetes e incidencias sean consultables.
5. Busca por calle, número exterior/interior, manzana y lote; confirma que los resultados se limitan al tenant activo.

### Pruebas pendientes para cierre
- **Cámara física:** instalar/abrir Guard en Android e iOS usando HTTPS. Probar 20 QR válidos y 20 inválidos en red estable; registrar la latencia lectura→resultado y exigir p95 < 2 s. No considerar la cámara simulada del navegador como prueba física.
- **Recuperación del scanner:** Guard ofrece “Cancelar inicio” mientras solicita cámara y “Detener cámara” durante lectura; vuelve a estado disponible tras 12 s sin iniciar o 30 s sin detectar código. La validación del API cancela tras 10 s y mantiene el resultado como no autorizado.
- **Notificaciones premium:** con tenant `NOTIFICATIONS_PREMIUM` y credenciales del proveedor, verificar envío WhatsApp y fallback SMTP. Repetir con tenant sin entitlement y confirmar `NOT_CONFIGURED`; una falla de notificación no debe cambiar la autorización QR.
- **Rendimiento de búsqueda:** medir 50 consultas de placas/domicilios en staging y registrar p95 < 100 ms.

`pnpm test` ejecuta ahora regresiones E2E del API con PostgreSQL real y el tenant QA. Las pruebas no certifican cámara física, proveedores externos ni rendimiento de staging; esos huecos se registran por separado.

### Regresión automatizada de API (MFA, Guard y sesiones Resident móviles)
El paquete API ejecuta pruebas E2E con `node:test` contra PostgreSQL real y la API local. El setup aplica 003–023 y ejecuta el seed QA idempotentemente. La cobertura incluye MFA, roles/aislamiento, Guards, avisos de caseta, migraciones financieras, sesiones Android/iOS, rotación/replay, revocación por contraseña/dispositivo, avisos, finanzas, rendición mensual y compatibilidad PWA. Configura credenciales locales en `apps/api/.env.local`; API y runner deben compartir `AUTH_TOKEN_SECRET` de prueba (mínimo 32 caracteres). Nunca reutilices secretos de PROD. Levanta PostgreSQL y el API:
```bash
pnpm --filter @dommia/api dev
```

Ejecuta desde otra terminal `pnpm test` (monorepo) o `pnpm --filter @dommia/api test`. El helper espera hasta 15 segundos a que `http://localhost:4000/api/v1/health` responda 200, configurable con `DOMMIA_TEST_STARTUP_TIMEOUT_MS`. Las pruebas comprueban que el token MFA pendiente no accede a rutas CRM, que los códigos/desafíos no se reutilizan, que TENANT_ADMIN no entra al CRM y que una visita sin QR solo se registra después de marcar INE/llamada; el log identifica al guardia y consume pases SINGLE. El seed `guard-qa` es idempotente; la invitación temporal del test se elimina al terminar. Se puede configurar `DOMMIA_TEST_API_BASE` para apuntar a otro API QA; nunca producción.

**Último resultado DEV:** 2026-09-30, `pnpm --filter @dommia/api test`: API 16/16 contra PostgreSQL Docker 16.15. Incluye 401/403 por rol/tenant/vivienda, lectura Guard, MFA, sesiones móviles y rendición mensual: escritura exclusiva `TENANT_ADMIN`, evidencia Resident redactada, publicación inmutable, revisión opcional/idempotente e ingresos del mismo día separados por categoría y método de pago. Migración 023 usa almacenamiento local de evidencia en DEV; GCS se valida en staging/PROD.

**Prueba visual del flujo sin QR (2026-09-28):** en Guard con `guard-qa`, busqué `Circuito del Roble 101`, seleccioné una invitación SINGLE vigente, marqué INE verificada y llamada confirmada, y la interfaz mostró “Acceso manual autorizado por llamada” con visitante, propiedad, anfitrión y método. La invitación y su log temporal de navegador se eliminaron al terminar; no se capturó ni almacenó número/foto de INE.

### Tenant QA aislado
Ejecuta desde la raíz del repositorio para crear o completar el tenant `guard-qa` sin alterar otros fraccionamientos:
```bash
for migration in docker/migrations/*.sql; do
  docker exec -i dommia_postgres psql -v ON_ERROR_STOP=1 -U dommia_admin -d dommia_master < "$migration"
done
docker exec -i dommia_postgres psql -v ON_ERROR_STOP=1 -U dommia_admin -d dommia_master < scratch/seed_guard_qa.sql
```

Credenciales locales de QA (no reutilizar fuera de desarrollo):
- **Communities / administrador:** `admin.guard-qa@dommia.test` / `GuardQa2026!`
- **Guardias:** `guard.norte@qa.dommia.test`, `guard.sur@qa.dommia.test`, `guard.apoyo@qa.dommia.test` / `GuardQa2026!`
- **Residentes:** `ana.rivera@qa.dommia.test`, `bruno.salas@qa.dommia.test`, `clara.vega@qa.dommia.test`, `diego.luna@qa.dommia.test` / `ResidentQa2026!`

El tenant QA habilita `ACCESS_QR`; Stripe, RFID y notificaciones premium permanecen desactivados. Incluye una propiedad morosa, vehículos de propietario/inquilino/familiar, una placa de visita frecuente y una placa bloqueada.

### Evidencia del punto 2: QR y cámara (2026-09-28)
- **API QA:** 20/20 códigos válidos autorizados y 20/20 códigos inválidos rechazados. p95 de ida y vuelta local: 120 ms para válidos y 29 ms para inválidos. Esto mide API/red local, no decodificación de cámara.
- **Cámara del navegador de pruebas:** Guard se sirvió en contexto seguro (`localhost`), pero Chromium reportó permiso `denied` y no expuso un stream de vídeo; no se completaron lecturas con cámara.
- **Android/iOS físicos:** pendiente. No marcar como superado hasta conceder permisos en dispositivos reales, ejecutar 20 QR válidos y 20 inválidos y medir p95 lectura→resultado < 2 s.
- Los 20 pases y sus logs temporales del ensayo API se eliminaron al finalizar; el paquete y la incidencia QA de la prueba del punto 1 permanecen disponibles en `guard-qa`.

### Evidencia de puntos 4 y 5 (2026-09-28)
- **Búsqueda:** 50 consultas locales alternando domicilio y placa en `guard-qa`; 50/50 devolvieron resultados, p95 20 ms y máximo 36 ms. La medición de staging sigue pendiente.
- **Pases por residente:** el lookup mostró el pase temporal de Ana Rivera mientras estuvo activo; después de revocarlo desapareció. Otro tenant recibió `403` con la sesión Guard QA.
- **Paquetería <15 s:** recepción y retiro funcionaron desde la UI, pero no se midió una captura manual cronometrada; registrar esa medición en el dispositivo/turno real antes de cerrar el criterio.

### Evidencia LPR asistido (2026-09-28)
- Guard acepta una foto desde cámara/archivo; `tesseract.js` procesa el archivo localmente en el navegador. No se envía la imagen al API.
- El OCR solo rellena el buscador con una sugerencia editable; el guardia debe pulsar **Buscar** y revisar la clasificación del API. El resultado no autoriza ni deniega accesos.
- Las etiquetas visuales diferencian propietario (azul), inquilino (ámbar), familiar (violeta), visita frecuente (naranja), bloqueo (rojo) y otros estados; cada una mantiene texto además del color.
- Verificación visual con fixture sintética: `QAA-1001` se leyó con confianza 90% y el lookup de `guard-qa` la clasificó como Propietario (Toyota Corolla, Circuito del Roble #101). Esta es una prueba de integración con imagen artificial, no validación de precisión LPR real.
- Reproducción en macOS: `sips -s format png apps/guard-pwa/test/fixtures/plate-sample.svg --out /tmp/dommia-plate-sample.png`; subir el PNG en Guard, pulsar **Leer placa**, verificar la sugerencia y confirmar manualmente con **Buscar**.
- Fixture mexicana sintética, inclinada y con texto alrededor: `sips -s format png apps/guard-pwa/test/fixtures/plate-mexico-sample.svg --out /tmp/dommia-plate-mexico.png`; Guard propuso `TRT-827-A` al 47% con segmentación `SINGLE_BLOCK`. El OCR no propone sugerencias debajo de 40% de confianza.
- `pnpm --filter @dommia/guard-pwa test`: 2/2 pruebas del parser pasan, incluidas `TRT-827-A`, `TRT 827 A`, `TRT827A` y matrícula con texto de fondo. La build de Guard pasa.
- Pendiente: placas mexicanas reales, desenfoque/reflejo/ángulo, tablet/cámara física Android/iOS, modo nocturno y tiempos p95. El OCR queda como asistencia, no LPR automático.

### Evidencia del punto 3: notificaciones premium (2026-09-28)
- **Sin entitlement:** en `guard-qa`, una visita QR válida se autorizó y devolvió `NOT_CONFIGURED`; la respuesta no expuso correo, teléfono ni campos de contacto. El pase y el log temporal de esta prueba se eliminaron.
- **WhatsApp Business y fallback SMTP:** pendiente. La base local no tiene tenants con `NOTIFICATIONS_PREMIUM` ni canales configurados. Completar en otro ambiente con tenant contratado y credenciales reales; verificar WhatsApp exitoso, fallback a SMTP cuando WhatsApp falle y que ningún fallo de entrega cambie la decisión de acceso.
- No guardar tokens, contraseñas ni secretos de proveedor en este documento o en el seed QA.

### Evidencia Compartir QR con tarjeta DOMMIA (2026-09-28)
- El modal de pase genera una imagen PNG vertical con estilo DOMMIA ACCESS y QR al enlace permanente del pase, no una captura del TOTP de 15 segundos.
- En navegadores móviles compatibles, Web Share API entrega el archivo a la hoja nativa para seleccionar WhatsApp, correo u otra aplicación. Si no se soporta compartir archivos, el modal comparte el enlace o descarga el PNG según capacidades del navegador.
- `pnpm --filter @dommia/resident-pwa build` pasa. La hoja nativa Android/iOS debe validarse en dispositivos reales; la descarga de escritorio es un fallback y requiere adjuntar el PNG manualmente.


