# 🗺️ Plan de Trabajo Maestro: SaaS Modular para Fraccionamientos (v3 - Producción)

Este documento detalla las especificaciones técnicas, arquitectura y fases de desarrollo necesarias para construir un software como servicio (SaaS) multi-tenant acoplado a hardware IoT (Internet de las Cosas) de control de accesos, incorporando flujos comerciales y de tolerancia a fallos.

---

## 🏗️ 1. Arquitectura General y Buenas Prácticas de Ingeniería

Para garantizar la escalabilidad global del SaaS y blindar el sistema contra la inestabilidad del internet en campo, el desarrollo se regirá bajo una arquitectura desacoplada y orientada a eventos.

### A. Base de Datos (BD) - Estrategia Híbrida de Multi-tenancy
*   **Base de Datos Global (SuperAdmin):** Una base de datos relacional única (**PostgreSQL**) centralizada en la nube que gestiona catálogos maestros: Fraccionamientos activos, Tiers de membresías, Webhooks de Stripe, Facturación global e Inventario de Hardware.
*   **Aislamiento Operativo (Por Fraccionamiento):** Cada fraccionamiento contará con su propio **Esquema de Base de Datos separado (Schemas de PostgreSQL)**. Esto blinda por completo la seguridad de los datos de los residentes, optimiza los índices de búsqueda independientes y facilita la eliminación o respaldo individualizado de información.
*   **BD Local en Caseta (Edge Computing):** Cada Gateway físico instalado en las casetas utilizará **SQLite** como motor local. Contendrá réplicas ligeras de los residentes y TAGs autorizados para ejecutar validaciones físicas en milisegundos sin depender de la nube.
*   **Caché en la Nube:** **Redis** para el manejo de sesiones de usuarios de la PWA, control de tokens temporales de accesos y colas de mensajes del hardware.

### B. Backend (API en la Nube)
*   **Tecnología Recomendada:** **Node.js (NestJS)** o **Go (Golang)** por su alto desempeño procesando peticiones concurrentes y WebSockets/MQTT simultáneos.
*   **Control de Características (Feature Toggling):** La API contará con filtros interceptores nativos. Cada petición de hardware o software validará en el esquema del SuperAdmin si el módulo solicitado (ej. accesos por QR) se encuentra activo y pagado por ese fraccionamiento antes de ejecutar cualquier lógica.
*   **Idempotencia Obligatoria:** Todos los endpoints financieros (Stripe) y operativos de sincronización local requerirán un identificador único global (`UUID`). Si por intermitencia de red la caseta envía dos veces el mismo registro, el backend verificará el `UUID` y descartará el duplicado para mantener la integridad de los datos.

### C. Frontend & Apps
*   **Portal de Administración, Guardia y PWA de Residentes:** Desarrollado en **React.js** o **Next.js** bajo una filosofía *Offline-First*. Se implementarán *Service Workers* y almacenamiento local vía *IndexedDB* en el navegador web del residente para asegurar que sus códigos QR vigentes puedan renderizarse aunque no cuente con señal celular en la entrada.
*   **Módulo App Nativa Premium:** Desarrollada con **React Native + Expo** compartiendo la lógica de negocio de la PWA web, pero interactuando de forma nativa con las APIs del teléfono para desbloquear biometría (FaceID/TouchID) y SDKs de pago rápidos (Apple Pay / Google Pay).

---

## 🛠️ 2. El Kit de Actualización IoT (Hardware Estandarizado)

El SaaS no se adaptará al hardware antiguo de los fraccionamientos; se establecerá un estándar de compatibilidad física universal que reduce drásticamente el costo de desarrollo y soporte técnico.

[ Antena RFID / Lector QR ]│ (Salida Wiegand de 26/34 bits)▼[ Tarjeta Controladora de Relevadores ]│ (Conexión Serial/USB/LAN)▼[ Gateway Local (Mini PC / Raspberry Pi) ] ─── (MQTT con TLS) ───► [ SaaS Nube ]│ (Contacto Seco)▼[ Motor de la Pluma Vehicular ]

*   **Capa Física Estándar (Wiegand):** El sistema aceptará cualquier lectora del mercado (antenas vehiculares UHF, lectoras de proximidad, lectores de QR) siempre y cuando transmitan la información mediante el protocolo de la industria **Wiegand de 26 o 34 bits**.
*   **El Dispositivo Puente (Gateway Local):** Una minicomputadora industrial o Raspberry Pi configurada dentro de una caja protegida en la caseta. Este dispositivo ejecutará un servicio en segundo plano (desarrollado en Python o Node.js) que se conectará con la controladora de relevadores y mantendrá comunicación encriptada con el SaaS mediante **MQTT sobre TLS**.
*   **Accionamiento Universal:** El Gateway local se cableará a los relevadores físicos de la caseta para mandar un pulso eléctrico de **contacto seco** (Normal Abierto) directo al motor de cualquier marca de pluma vehicular del mercado.

---

## 📅 3. Fases de Desarrollo (Roadmap de Ingeniería)

### Fase 1: Core de Negocio, Landing Page y SuperAdmin CRM (Mes 1 - 2)
*   **Objetivo:** Desarrollar la infraestructura de comercialización del SaaS, el control de Tiers de membresías y el onboarding de nuevos fraccionamientos.
*   **Entregables:**
    *   **Landing Page Pública:** Presentación comercial interactiva de los módulos del sistema.
    *   **Dashboard SuperAdmin (Tu CRM):** Panel para dar de alta Tiers de precios, monitorear el estado operativo (*Health Check*) de los Gateways remotos en tiempo real mediante Heartbeats MQTT cada 30 segundos, y gestionar el inventario de hardware enviado.
    *   **Flujo de Registro Comercial:** El administrador contrata un paquete declarando el número de casas. Si elige un Tier de 0-100 casas, el backend fija ese parámetro como un límite duro.

### Fase 2: Padrón de Residentes, Finanzas Manuales y PWA (Mes 3 - 4)
*   **Objetivo:** Habilitar el módulo operativo básico del fraccionamiento que no requiere integraciones físicas.
*   **Entregables:**
    *   **Módulo del Administrador:** Gestión de esquemas, propiedades e inquilinos. El sistema impedirá crear una casa adicional si se ha alcanzado el límite contratado en el SuperAdmin, invitándolo a realizar un Upgrade manual en su suscripción de Stripe.
    *   **Módulo Financiero Base:** Generación automática de cobros de mantenimiento el día 1 del mes, estados de cuenta y carga manual de comprobantes bancarios.
    *   **PWA de Residentes:** Acceso mediante enlace directo de WhatsApp, configuración de perfil y visualización de notificaciones masivas.

### Fase 3: Integración Fintech con Stripe (Mes 5)
*   **Objetivo:** Automatizar por completo la recaudación de fondos y activar la versión App Nativa Premium.
*   **Entregables:**
    *   **Pasarela Automatizada:** Integración de webhooks de Stripe para procesar cobros automáticos mediante Tarjeta, Transferencias SPEI con referencias únicas y conciliación inmediata en el saldo de la propiedad.
    *   **Despliegue de App Premium:** Empaquetado nativo para App Store y Play Store que habilita inicios de sesión rápidos con datos biométricos (FaceID) para autorizar transacciones monetarias seguras.

### Fase 4: Sincronización IoT y Modo Offline de Caseta (Mes 6 - 7)
*   **Objetivo:** Implementar la lógica del Kit de Actualización física en la caseta de vigilancia garantizando la tolerancia a fallos.
*   **Entregables:**
    *   **Desarrollo del Firmware del Gateway:** Lógica local en SQLite para procesar los accesos de TAGs RFID vehiculares en menos de 1 segundo.
    *   **Algoritmo de Buffer Circular Local:** Si el internet de la caseta falla, los eventos de acceso se guardan de forma local. Si el almacenamiento de la tarjeta de memoria del Gateway llega al 90%, un script automatizado eliminará los registros más antiguos que *ya fueron sincronizados con la nube*, protegiendo la base de datos local contra corrupciones de disco.
    *   **Conciliación en Lote (Batch Sync):** Al detectar la reconexión a internet mediante la reanudación del canal MQTT, el Gateway subirá de manera estructurada e idéntica los registros almacenados temporalmente utilizando `UUIDs` de origen para evitar duplicación de información en el SaaS.

### Fase 5: Módulo de Invitaciones por QR Dinámico (Mes 8)
*   **Objetivo:** Desplegar el sistema de accesos seguros y controlados para visitas.
*   **Entregables:**
    *   **Lógica de QR Dinámico (TOTP):** La PWA/App del residente generará códigos QR encriptados mediante AES-256 que cambiarán automáticamente cada 15 segundos basándose en algoritmos de tiempo (como Google Authenticator). Esto anula por completo la posibilidad de usar capturas de pantalla viejas compartidas por mensajería.
    *   **Módulo del Guardia de Caseta:** Interfaz web responsiva ultraligera para la tablet o computadora de caseta que muestra alertas visuales inmediatas cuando el escáner físico de QR procesa y valida un acceso de forma exitosa.

### Adenda de Prioridad Vigente (2026-09-27)
La ejecución actual prioriza Fase 6 digital-first: Dommia Access valida QR TOTP en línea y Dommia Guard opera como PWA tablet-first. RFID, Wiegand, Gateway, MQTT y apertura automática quedan post-MVP; esta prioridad sustituye para el MVP cualquier flujo de apertura física descrito en este documento.

P1 de Dommia Guard se entrega por incrementos: validación QR, búsqueda tenant-scoped de residentes y placas, registro y retiro auditado de paquetería, incidencias de seguridad e historial operativo. La búsqueda y paquetería tienen una primera implementación funcional; incidencias e historial siguen pendientes. El plan detallado y sus criterios de aceptación se mantienen en `Plan de Desarrollo Maestro por Fases.md`.

---

## 🔒 4. Flujos Clave Detallados (Para Implementación de Código)

### Flujo de Límite Duro de Propiedades (Membresías Controladas)
1. El Administrador del Fraccionamiento da clic en "Agregar Nueva Propiedad".
2. El Backend consulta en el Schema Global el parámetro `limite_casas_permitidas` contratado en su Tier actual.
3. El Backend ejecuta un conteo rápido (`COUNT(*)`) de las propiedades registradas en el esquema de ese fraccionamiento.
4. **Condicional:**
    * Si `conteo_actual < limite_casas_permitidas`: Se procesa el registro de manera exitosa.
    * Si `conteo_actual >= limite_casas_permitidas`: La API rechaza la petición enviando un código de error `403 Forbidden` con el mensaje: *"Límite de casas alcanzado en tu plan actual"*. El Frontend bloquea el botón de guardado y despliega un modal con la leyenda: *"¿Tu fraccionamiento ha crecido? Solicita un Upgrade de plan aquí"* redireccionándolo al portal de facturación de Stripe.

### Flujo de Validación de Accesos QR Dinámico en Caseta
1. El visitante coloca su celular frente al lector de QR de la caseta.
2. El lector lee la cadena de texto encriptada y la envía al Gateway Local vía cable Wiegand/Serial.
3. El script del Gateway desencripta la cadena usando la llave simétrica local y extrae los datos: `id_fraccionamiento`, `id_casa`, `timestamp_generacion` y la `firma_criptografica`.
4. El Gateway ejecuta tres validaciones locales estrictas:
    * **Validación 1:** Compara si el `id_fraccionamiento` coincide con el suyo.
    * **Validación 2:** Evalúa si la diferencia entre el `timestamp_actual` y el `timestamp_generacion` es menor o igual a 15 segundos.
    * **Validación 3:** Verifica en su base SQLite local si la propiedad vinculada a la `id_casa` no cuenta con bloqueos administrativos por morosidad (si el módulo de bloqueo por adeudos está activo).
5. **Resultado:**
    * Si las tres validaciones son exitosas: El Gateway envía la instrucción a la placa de relevadores para abrir la pluma, guarda el log con un `UUID` único y renderiza una alerta verde en la pantalla del guardia.
    * Si falla alguna validación: La pluma permanece cerrada y el sistema emite una alerta auditiva y visual de rechazo al guardia de seguridad.