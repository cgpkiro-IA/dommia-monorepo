# Manual DOMMIA para principiantes

**Actualizado:** 30 de septiembre de 2026  
**A quién va dirigido:** equipo comercial, operador SaaS, administrador de una comunidad y personal de caseta.

Esta guía explica el recorrido desde la contratación de una membresía hasta la puesta en marcha de las aplicaciones. Separa lo que el sistema permite hacer hoy de lo que todavía requiere apoyo técnico.

> **Importante antes de empezar:** el alta de un fraccionamiento crea su espacio de datos, pero actualmente no crea desde el CRM la cuenta global `TENANT_ADMIN` que necesita para entrar a Communities. El flujo de autoalta también muestra una pantalla de éxito sin crear esa cuenta. No entregues el servicio como listo hasta que el equipo responsable confirme el acceso del administrador. No resuelvas esto compartiendo la cuenta `SUPER_ADMIN` ni editando la base de datos manualmente.

## 1. ¿Qué aplicación usa cada persona?

| Persona | Aplicación | Para qué sirve |
| --- | --- | --- |
| Equipo DOMMIA | **Portal Web** | Mostrar planes, solicitar una demostración o iniciar el formulario de contratación. |
| Equipo DOMMIA | **CRM Maestro** | Administrar prospectos, planes, altas de comunidades y gateways. |
| Administración de la comunidad | **Communities** | Administrar viviendas, residentes, vehículos, cuotas, avisos y guardias. |
| Personal de caseta | **Guard** | Consultar y registrar operaciones de acceso. |
| Residentes | **Resident PWA** | Consultar su comunidad y usar las funciones disponibles para su cuenta. |

Las aplicaciones web en desarrollo local usan estas direcciones:

| Aplicación | Dirección local |
| --- | --- |
| Portal Web | `http://localhost:3000` |
| CRM Maestro | `http://localhost:3001` |
| Communities | `http://localhost:3002` |
| Resident PWA | `http://localhost:3003` |
| Guard PWA | `http://localhost:3004` |
| API (salud) | `http://localhost:4000/api/v1/health` |

`localhost` es solo para desarrollo en la misma computadora. En producción, DOMMIA debe entregar las direcciones HTTPS definitivas. La guía de producción todavía indica que los dominios deben definirse; no inventes ni compartas una URL productiva.

## 2. Antes de contratar

Ten a la mano estos datos:

- Nombre legal o comercial de la comunidad.
- Número de viviendas que se administrarán.
- Nombre y correo del administrador responsable.
- Plan y módulos que se contratarán.
- Preferencia de dirección web: dominio estándar o subdominio personalizado, si aplica.
- Información del método de pago y comprobante, cuando corresponda.

En el CRM, revisa **Planes & Módulos** para consultar el catálogo vigente. El precio y el límite dependen del plan configurado; confirma la propuesta y el contrato antes de activar el servicio.

## 3. Elegir cómo contratar

### Opción A: solicitar una demostración

1. Abre el Portal Web.
2. Usa el cotizador para estimar el plan según el número de viviendas.
3. Selecciona **Solicitar demostración** y captura nombre, correo, teléfono y comunidad.
4. El contacto aparecerá como prospecto en el CRM. Esta solicitud **no contrata, no cobra y no activa** una comunidad.
5. El equipo comercial contacta al prospecto, valida necesidades y documenta la propuesta.
6. Cuando exista aprobación y pago confirmado, el operador realiza el alta descrita en la sección 4.

### Opción B: formulario de activación del Portal

El formulario solicita nombre de la comunidad, identificador, plan, administrador, correo y contraseña. Puede presentar una tarjeta de prueba y un botón de activación.

**No introduzcas una tarjeta real ni tomes la pantalla de éxito como comprobante de pago.** En la versión actual, esa tarjeta es un simulador: el backend no procesa el cobro en este flujo. La fuente de avance del MVP define SPEI con comprobante y validación manual, o pago en efectivo registrado; Stripe es opcional y no bloquea el MVP.

Además, el autoaprovisionamiento actual no crea la cuenta de acceso `TENANT_ADMIN`. Úsalo solo en una prueba controlada hasta que la cuenta se aprovisione correctamente y el pago se verifique por el proceso autorizado.

## 4. Alta asistida desde CRM Maestro

Esta parte la realiza un operador DOMMIA con una cuenta de CRM autorizada, normalmente `SUPER_ADMIN`.

1. En CRM Maestro, abre **Fraccionamientos / Tenants** y selecciona **Alta y Aprovisionamiento de Fraccionamiento**.
2. Captura el nombre de la comunidad y el correo de contacto.
3. Define un `slug` único, corto y sencillo, por ejemplo `lomas_del_valle`. Se usará para identificar la comunidad; no incluyas datos personales.
4. Selecciona el plan contratado y registra el límite de viviendas acordado. No pongas un límite menor ni mayor al contrato.
5. Activa solamente los módulos incluidos en la membresía. Entre las opciones actuales están finanzas, acceso QR, RFID, Resident PWA y notificaciones premium.
6. Revisa la dirección que muestra el formulario. Los planes estándar usan `standar.dommia.com/<slug>`; el subdominio personalizado depende del plan/add-on y de que DNS y HTTPS estén configurados.
7. Guarda el alta y confirma que el tenant aparece en la lista.
8. Registra por el canal comercial el plan, límite, módulos, fecha de inicio y evidencia de pago/contrato.
9. **Antes de entregar el acceso**, solicita al equipo técnico el aprovisionamiento y validación de la cuenta `TENANT_ADMIN` para esta comunidad. La interfaz del CRM no completa ese paso hoy.

El alta crea el tenant y su espacio aislado. No crea automáticamente viviendas, residentes, cuentas de guardia ni datos de operación.

## 5. Primer ingreso de la administración

Una vez que el equipo responsable confirme la cuenta `TENANT_ADMIN`:

1. Abre la dirección HTTPS de Communities que te entregaron.
2. Inicia sesión con el correo y contraseña individuales asignados al administrador.
3. Si la cuenta tiene acceso a más de una comunidad, elige el espacio de trabajo correcto.
4. Abre **Seguridad** y configura MFA cuando la opción esté disponible para la cuenta. Guarda los códigos de recuperación fuera del correo y del equipo compartido.
5. Comprueba que el nombre de la comunidad y el plan sean los contratados. Si algo no coincide, detén la carga de datos y pide corrección.

Nunca compartas una cuenta de administrador entre varias personas. Solicita una cuenta individual con el rol mínimo necesario.

## 6. Configurar la comunidad en Communities

### Registrar viviendas

1. Abre **Viviendas & Lotes** y pulsa **Agregar vivienda**.
2. Captura calle, número exterior, interior, manzana y lote según corresponda.
3. Guarda y repite hasta completar el padrón inicial.
4. Revisa el contador de viviendas y el límite del plan. El sistema debe bloquear altas que excedan el límite contratado.

Usa siempre la misma convención para calles, números y manzanas; así la caseta encontrará domicilios más rápido.

### Registrar e invitar residentes

1. Abre **Padrón de Residentes** y pulsa **Registrar Residente**.
2. Selecciona la vivienda correcta y captura nombre, apellidos y al menos un medio de contacto: correo o celular.
3. Clasifica a la persona como propietario, arrendatario o familiar. Marca quién es el contacto titular principal.
4. Guarda el registro.
5. Selecciona al residente y genera una invitación, o usa **Invitar a todos** después de revisar el padrón.
6. Comparte el enlace de activación en privado. La invitación vence a las 24 horas; si vence, genera otra.
7. El residente abre el enlace, crea su contraseña y después inicia sesión con el correo/celular y el identificador de comunidad indicado.

El envío automático por correo o WhatsApp requiere el módulo premium y la configuración válida del proveedor. Si no están configurados, elige **Solo enlace** y compártelo por un canal seguro.

### Registrar vehículos y avisos

- En **Control Vehicular**, relaciona cada placa con su vivienda y, cuando aplique, con el residente correspondiente.
- En **Comunicados & Circulares**, publica avisos oficiales para la comunidad.
- No registres información sensible que no sea necesaria para operar el servicio.

## 7. Configurar Guard para caseta

Guard requiere el módulo **ACCESS_QR** para usar la sección de cuentas y flujos QR.

### Configurar las casetas y accesos

1. En Communities, abre **Caseta & Guardias** y localiza **Casetas y accesos**.
2. La comunidad inicia con un punto llamado **Acceso principal**. Renómbralo o agrega puntos con el nombre que usan en sitio, por ejemplo **Caseta 1**, **Caseta 2** o **Acceso B**.
3. Para retirar un punto, desactívalo. No se elimina y sus registros históricos conservan el nombre que tenía cuando ocurrió el movimiento.
4. Mantén al menos un punto activo. Si solo hay uno, Guard lo selecciona automáticamente.

1. En Communities, abre **Caseta & Guardias**.
2. Selecciona **Crear cuenta de guardia**.
3. Captura nombre, apellidos, correo y una contraseña inicial individual. Debe tener al menos 10 caracteres con mayúscula, minúscula, número y símbolo.
4. Comparte la contraseña por un medio seguro y pide al guardia cambiarla si el flujo de la instalación lo permite.
5. Abre la URL HTTPS de Guard en el dispositivo de caseta, inicia sesión con la cuenta creada y verifica que corresponde a la comunidad correcta.
6. Al registrar un servicio, selecciona **Caseta o acceso de entrada**. Si hay más de uno activo, Guard requiere una selección.
7. Al registrar la salida, selecciona **Caseta o acceso de salida**. La entrada y la salida pueden usar puntos distintos.
8. Prueba una búsqueda de domicilio/placa, una invitación QR y el recorrido de entrada/salida de un servicio antes de iniciar el turno.

Si se usa cámara para escanear QR, concede permiso de cámara al navegador. En algunos teléfonos y navegadores la cámara requiere HTTPS; no uses una URL HTTP pública.

## 8. Instalar Resident en el teléfono

Resident PWA funciona desde el navegador y puede agregarse a la pantalla de inicio. Primero, la administración debe haber creado el perfil y el residente debe activar su invitación.

### Android

1. Abre la URL HTTPS de Resident en Chrome.
2. Inicia sesión una vez para comprobar que el correo/celular y la comunidad son correctos.
3. Abre el menú de Chrome y selecciona **Instalar aplicación** o **Agregar a pantalla principal**.
4. Confirma la instalación y abre DOMMIA desde el nuevo icono.

### iPhone o iPad

1. Abre la URL HTTPS de Resident en Safari.
2. Inicia sesión y verifica el perfil.
3. Pulsa **Compartir** y selecciona **Agregar a pantalla de inicio**.
4. Abre DOMMIA desde el icono creado.

La aplicación nativa Android tiene código disponible, pero la distribución del instalador debe entregarse por el canal aprobado por DOMMIA. La app iOS todavía necesita configuración y firma en Xcode; mientras tanto, usa Resident PWA en Safari.

## 9. Módulos opcionales y preparación física

- **Finanzas:** configura cuotas y métodos de cobro acordados. El MVP contempla SPEI con validación manual y efectivo registrado; no prometas cobro automático por tarjeta sin una integración aprobada.
- **Notificaciones premium:** requiere entitlement y configuración de SMTP/WhatsApp. Haz una prueba controlada antes de notificar a todos.
- **RFID, gateways y apertura física:** no forman parte del despliegue digital estándar del MVP. Requieren evaluación de hardware, configuración y pruebas separadas; no conectes equipo físico sin autorización.
- **Dominio:** el operador de infraestructura debe configurar DNS, certificado HTTPS y rutas de la app/API. El campo del CRM por sí solo no crea un DNS público.

## 10. Lista de entrega

Antes de declarar la comunidad lista, confirma cada punto:

- [ ] Contrato, plan, límite de viviendas, módulos y pago revisados.
- [ ] Tenant creado y visible en CRM con `slug` correcto.
- [ ] Cuenta individual `TENANT_ADMIN` creada y acceso probado.
- [ ] URL HTTPS correcta desde una computadora y un teléfono fuera de la red de desarrollo.
- [ ] Comunidades y viviendas cargadas, sin exceder el límite.
- [ ] Residentes registrados con correo o celular correctos.
- [ ] Invitación probada: activación, contraseña propia e inicio de sesión Resident.
- [ ] Cuentas de guardia individuales creadas; acceso Guard y búsqueda comprobados.
- [ ] Módulos opcionales probados solo si fueron contratados y configurados.
- [ ] Responsable de soporte y proceso para reportar incidencias comunicados.

## 11. Levantar el entorno local de desarrollo

Esta sección es para pruebas en la computadora del equipo técnico. No es la instalación de producción ni debe usarse para atender residentes reales.

1. Instala Docker Desktop, Node.js y Corepack; clona el repositorio y prepara dependencias con el procedimiento del equipo.
2. Desde la raíz, inicia la base y el broker:

   ```powershell
   docker compose up -d postgres emqx
   ```

3. En terminales separadas, inicia la API y las cinco aplicaciones:

   ```powershell
   corepack pnpm --ignore-scripts --filter @dommia/api dev
   corepack pnpm --ignore-scripts --filter @dommia/portal-web dev
   corepack pnpm --ignore-scripts --filter @dommia/crm-admin dev
   corepack pnpm --ignore-scripts --filter @dommia/communities-admin dev
   corepack pnpm --ignore-scripts --filter @dommia/resident-pwa dev
   corepack pnpm --ignore-scripts --filter @dommia/guard-pwa dev
   ```

4. Comprueba que `/api/v1/health` y los portales respondan. Para las pruebas E2E, sigue [Testing/README.md](../../Testing/README.md).
5. No ejecutes `docker compose down -v` para un apagado normal: elimina los datos locales. Para apagar, detén los procesos de desarrollo y ejecuta `docker compose down` solo cuando ya no necesites la base.

Los archivos `.env.local` contienen configuración local. No copies secretos de desarrollo a producción ni los compartas en capturas, tickets o mensajes.

## 12. ¿A quién pedir ayuda?

- **No puedes iniciar sesión en Communities después del alta:** pide al operador validar la cuenta `TENANT_ADMIN`; el alta actual no la crea desde CRM.
- **No aparece una sección:** confirma primero que el módulo correspondiente está incluido en la membresía.
- **El enlace de invitación expiró:** genera una nueva invitación desde el padrón.
- **La app funciona en la computadora pero no en el teléfono:** no uses `localhost` en el teléfono; solicita la URL HTTPS del entorno.
- **Un cobro no aparece:** el simulador del Portal no procesa pagos; verifica el comprobante con el área administrativa.
- **Un QR o cámara falla:** verifica módulo, cuenta, hora del dispositivo, permiso de cámara y conexión. Para RFID o plumas, contacta al responsable de hardware.

## Documentos relacionados

- [Guía de Testing y servicios](../../Testing/README.md)
- [Despliegue GCP Producción](../Despliegue%20GCP%20Produccion.md)
- [Contrato Resident Mobile v1](../Planes/Contrato%20Resident%20Mobile%20v1.md)
- [Conexión PostgreSQL y Multi-Tenancy](../Arquitectura/Conexion%20PostgreSQL%20y%20Multi-Tenancy.md)