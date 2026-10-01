# Protocolo de Seguridad, Protección de Propiedad Intelectual y Demostraciones Seguras

**DOMMIA — El Sistema Operativo de tu Comunidad**  
*Documento de Seguridad, Arquitectura Anti-Extracción y Protección de Activos Privados*

---

## 1. Objetivo y Fundamento

El presente documento establece las políticas de ingeniería, configuraciones de infraestructura y defensas a nivel de código diseñadas para garantizar que:

1. **La Demostración Comercial ("Solicitar Demostración") esté blindada** contra desarrolladores externos, competidores o agentes maliciosos que intenten realizar scraping, ingeniería inversa, descarga masiva de plantillas o replicación del portal privado.
2. **El Software Privado (Backoffice CRM, Communities y Resident PWA)** no exponga esquemas de base de datos, código fuente sin ofuscar, mapas de fuentes (*source maps*) ni documentos confidenciales.
3. **Los Flujos de Adquisición (Venta Asistida y Auto-Aprovisionamiento)** mantengan trazabilidad criptográfica y separación estricta de privilegios.

---

## 2. Amenazas Identificadas y Matriz de Mitigación

| Vector de Ataque / Extracción | Riesgo | Mecanismo de Defensa Implementado |
| :--- | :--- | :--- |
| **Scraping de Source Maps (.map)** | Reconstrucción del código TypeScript original desde DevTools. | `productionBrowserSourceMaps: false` en todos los `next.config.js` del monorepo. Ningún archivo `.ts`/`.tsx` se sirve al cliente. |
| **Robo de Identidad y Reconocimiento Bot** | Bots o desarrolladores usando correos temporales para inundar el sistema y extraer tokens de demo. | **Honeypot invisible** (`website_anti_bot_trap`) + **Filtro de dominios desechables** (`mailinator`, `tempmail`, `guerrillamail`, etc.) en `CrmService`. |
| **Extracción de Documentos Privados (PDF/Excel)** | Descarga de contratos tipo, hojas de cálculo contables o manuales de operación desde endpoints de demo. | **Sandbox Aislado**: Las sesiones demo no cuentan con endpoints de descarga de archivos reales. Cualquier vista previa exportable genera marcas de agua digitales ("*MUESTRA DEMOSTRATIVA DOMMIA*"). |
| **Filtración de Esquemas de Base de Datos** | Inyección o sondeo para descubrir nombres de tablas o arquitectura multi-tenant. | Supresión de trazas de error SQL en producción (`InternalServerErrorException` sin stack traces). La API jamás expone los identificadores internos `tenant_<slug>`. |
| **Framing y Clickjacking** | Embeber el portal privado o la demo dentro de un `<iframe>` de un sitio competidor para clonar la UI. | Cabeceras HTTP estrictas: `X-Frame-Options: DENY` (CRM) y `SAMEORIGIN` (Portal), `X-Content-Type-Options: nosniff`. |
| **Fingerprinting de Tecnología** | Identificar versiones exactas de frameworks para buscar vulnerabilidades conocidas. | `poweredByHeader: false` en Next.js y ocultación de firmas en cabeceras Express/NestJS. |

---

## 3. Protocolo de Demostración Comercial ("Solicitar Demostración")

### 3.1. Filosofía de "Demostración Asistida vs. Sandbox Efímero"
A diferencia de aplicaciones de código abierto o plantillas públicas, el software administrativo de **DOMMIA** representa propiedad industrial protegida.

1. **Flujo de Captura Seguro (No Auto-Entrega de Credenciales):**
   - Cuando un visitante solicita una demostración en `apps/portal-web`, la solicitud **no genera credenciales administrativas directas en la respuesta HTTP**.
   - La solicitud viaja a `POST /api/v1/crm/prospects` y se encola en el CRM de Dommia como `LEAD`.
   - El equipo de ventas califica la autenticidad del fraccionamiento (mesa directiva o administración verificada) antes de agendar una videollamada guiada o activar un token temporal de sandbox.

2. **Defensas Activas en el Endpoint de Prospectos (`/api/v1/crm/prospects`):**
   - **Trampa Honeypot:** Campo oculto por CSS y `tabIndex={-1}`. Los scrapers automáticos que llenan todos los inputs son neutralizados inmediatamente; se les responde con un falso éxito 201 sin guardar datos en la base de datos ni emitir notificaciones.
   - **Bloqueador de Correos Desechables:** Si el correo contiene dominios como `tempmail.com`, `mailinator.com`, `10minutemail.com`, etc., la API rechaza la solicitud exigiendo un correo corporativo o personal verificable.

```typescript
// Fragmento de validación en CrmService (apps/api/src/crm/crm.service.ts)
const blockedDisposableDomains = [
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 
  'tempmail.com', 'yopmail.com', 'sharklasers.com', 
  'dispostable.com', 'trashmail.com', 'throwawaymail.com',
  'temp-mail.org', 'fakeinbox.com', 'getairmail.com'
];
if (emailDomain && blockedDisposableDomains.includes(emailDomain)) {
  throw new BadRequestException(
    'Por favor proporciona un correo corporativo o personal legítimo para programar la demostración protegida.'
  );
}
```

3. **Sandbox Efímero (`tenant_demo`):**
   - En caso de habilitar navegación interactiva al prospecto:
     - Opera únicamente dentro del esquema aislado `tenant_demo`.
     - Datos 100% sintéticos (nombres ficticios, direcciones simuladas).
     - Permisos restringidos: No se permite modificar configuraciones globales, ni ejecutar respaldos SQL, ni descargar archivos zip o código fuente.
     - Marca de agua flotante en la interfaz: `"DOMMIA DEMO ENVIRONMENT - PROPIEDAD PRIVADA REGISTRADA"`.

---

## 4. Endurecimiento de los Sitios Web y Aplicaciones Front-End

### 4.1. Configuración de Compilación y Servidor Next.js
En `apps/portal-web/next.config.js` y `apps/crm-admin/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@dommia/ui', '@dommia/shared-types'],
  poweredByHeader: false,
  productionBrowserSourceMaps: false, // CRÍTICO: Previene extracción de código fuente
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
```

### 4.2. Ofuscación y Protección de Recursos Estáticos
- Los archivos en la carpeta `/public` están limitados exclusivamente a elementos estéticos públicos (logos, favicons, texturas).
- Los contratos de arrendamiento, balances financieros y documentación técnica no residen en directorios públicos; se almacenan en almacenamiento de objetos privado (MinIO/S3) accesible únicamente mediante URLs firmadas con vencimiento corto (Presigned URLs de 5 minutos).

---

## 5. Arquitectura de Aislamiento en PostgreSQL

Para evitar que un usuario demo o un atacante pueda deducir o extraer datos de otros fraccionamientos:

1. **Aislamiento Físico por Esquemas (`schema-per-tenant`):**
   - Cada condominio tiene su propio esquema de base de datos (`tenant_<slug>`).
   - Cada operación tenant-scoped adquiere un cliente del pool y configura el schema de esa sesión con:
     ```sql
     SELECT set_config('search_path', $1, false);
     ```
   - El slug se normaliza y el schema se liga como parámetro. Al terminar se ejecuta `RESET search_path`; si la limpieza falla, el cliente se descarta del pool.
   - Las rutas API verifican sesión, rol y correspondencia del tenant antes de operar. Las credenciales PostgreSQL permanecen en el backend y nunca se entregan al navegador.
   - El detalle del pool, las transacciones y las migraciones está en [Conexión PostgreSQL y Multi-Tenancy](./Conexion%20PostgreSQL%20y%20Multi-Tenancy.md).

---

## 6. Checklist de Verificación de Seguridad en Despliegue

- [x] Source maps deshabilitados en entornos de producción.
- [x] Cabeceras `X-Frame-Options` y `X-Content-Type-Options` verificadas con `curl -I`.
- [x] Cabecera `X-Powered-By` suprimida.
- [x] Honeypot anti-bot activo en el formulario de la Landing Comercial.
- [x] Filtro de correos temporales/desechables activo en el endpoint de prospectos.
- [x] Flujo de Auto-Aprovisionamiento Inmediato validando subdominios únicos y contraseñas cifradas con `bcrypt`.
- [x] Esquemas de base de datos protegidos con `search_path` estricto y sin acceso cruzado entre tenants.
- [x] Helmet instalado globalmente; smoke local confirmó `X-Frame-Options` y otras cabeceras de seguridad.
- [x] CORS usa allowlist explícita y Joi rechaza en producción wildcard/orígenes no HTTPS, configuración PostgreSQL incompleta o llaves débiles.
- [x] `ValidationPipe` global transforma DTOs, elimina propiedades no declaradas y rechaza campos inesperados.
- [x] Passport JWT con `ApiAuthGuard` global, `@Public()` para excepciones explícitas y `@Roles()`/`RolesGuard` para RBAC.
- [x] Guards de dominio validan audiencia Resident, sesión revocable y aislamiento tenant/vivienda; API E2E local 15/15 el 2026-09-30.

## 7. Autenticación de Dos Pasos para Administradores

- La autenticación TOTP es opcional y se configura individualmente desde **Seguridad** en Dommia Communities o CRM Maestro.
- La activación requiere contraseña actual, registro en Microsoft Authenticator mediante QR o clave manual y confirmación de un código válido. El segundo factor se exige desde el siguiente inicio de sesión.
- El inicio de sesión devuelve un desafío de cinco minutos; el token de desafío no autoriza endpoints administrativos. Hay hasta cinco intentos por desafío, un límite de cinco desafíos por usuario cada 15 minutos y protección contra reutilización del código TOTP.
- Desactivar requiere contraseña actual y un código de autenticación válido.
- Los secretos TOTP se cifran con AES-256-GCM. En producción, configurar `MFA_ENCRYPTION_KEY` como exactamente 64 caracteres hexadecimales aleatorios, por ejemplo generados con `openssl rand -hex 32`. Guardar el valor en el gestor de secretos del entorno y conservarlo durante respaldos/restauraciones; cambiarlo sin migrar los secretos existentes impide descifrarlos.
- Aplicar `docker/migrations/015_admin_mfa.sql` antes de desplegar la versión que usa MFA. Las instalaciones nuevas lo ejecutan desde el script de inicialización de PostgreSQL.
- Las rutas administrativas de CRM requieren un token de sesión válido. Las rutas públicas de adquisición y consulta pública del tenant permanecen disponibles.
