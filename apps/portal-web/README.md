# Portal público para Firebase Hosting

Desde la raíz del monorepo:

```powershell
corepack pnpm --filter @dommia/portal-web build:static
firebase deploy --only hosting --project <FIREBASE_PROJECT_ID>
```

La primera orden exporta `apps/portal-web/out` y `firebase.json` sirve esa carpeta. Configura el dominio `dommia.com.mx` y TLS en Firebase Hosting antes de anunciar la URL pública. No se requiere API para navegar, cotizar ni redactar las solicitudes: ambos formularios abren el correo local dirigido a `info@dommia.com.mx`; el visitante debe enviar el mensaje desde su aplicación de correo. En equipos sin aplicación de correo configurada, el enlace `mailto:` no puede capturar la solicitud.

El catálogo congelado está en `src/features/calculator/static-plan-catalog.ts` y refleja los cuatro planes públicos consultados el 1 de octubre de 2026. Los cambios futuros de precios en CRM no aparecerán en Firebase hasta editar esa foto y volver a desplegar. No actives aprovisionamiento ni pagos automáticos en esta variante.

El comando normal `corepack pnpm --filter @dommia/portal-web build` conserva la integración con la API y el acceso de administradores. El modo estático solo se activa mediante `build:static`. Firebase no ejecuta el middleware Next, por lo que sus headers de seguridad básicos se configuran en `firebase.json`; el CSP con nonce se mantiene solo en el despliegue con servidor.

## Estado de publicación

La publicación de captación del 1 de octubre de 2026 está en el proyecto Firebase `dommia-saas-ef543`. Se verificó `https://dommia.com.mx/` con HTTP 200, contenido DOMMIA y `Cache-Control: no-store, no-cache, max-age=0, must-revalidate`. La regla está en `firebase.json` para evitar que una respuesta 404 antigua de la raíz se quede en caché; los chunks con hash siguen usando caché inmutable.

En la última revisión, Firebase mostraba el certificado de `www.dommia.com.mx` todavía en creación y el host rechazaba TLS. Usa el dominio raíz hasta que Firebase marque `www` como conectado y comprueba entonces su redirección.

La variante estática no escribe leads en el backend. Las solicitudes abren el correo local del visitante dirigido a `info@dommia.com.mx`, por lo que el usuario debe enviarlo desde un cliente de correo configurado.