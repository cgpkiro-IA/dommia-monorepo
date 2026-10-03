# Handoff: Portal estático en Firebase

## Estado

- Portal de captación exportado con `corepack pnpm --filter @dommia/portal-web build:static` y publicado en el proyecto Firebase `dommia-saas-ef543`.
- Hosting publica `apps/portal-web/out` desde `firebase.json`.
- `https://dommia.com.mx/` verificado con HTTP 200, título DOMMIA y sin parámetro de cache-busting.
- La raíz responde `Cache-Control: no-store, no-cache, max-age=0, must-revalidate`. Los chunks de `/_next/static/` conservan caché de un año e inmutable.
- `www.dommia.com.mx` tenía DNS CNAME correcto hacia `dommia-saas-ef543.web.app`, pero Firebase aún mostraba el certificado en creación y HTTPS fallaba con `ERR_TLS_CERT_ALTNAME_INVALID`.
- La publicación Firebase es solo la landing. API, CRM, Communities, Resident, Guard y Cloud SQL no se desplegaron como parte de esta tarea.

## Modo Firebase

- `NEXT_PUBLIC_PORTAL_STATIC_MODE=1` se activa solamente en `apps/portal-web/scripts/build-static.mjs`.
- Admin access se oculta en desktop, mobile y footer.
- CTA de activación, demo y cotizador generan `mailto:info@dommia.com.mx`; el usuario debe enviar el borrador. No hay captura server-side del lead.
- El cotizador usa `src/features/calculator/static-plan-catalog.ts`, una foto del catálogo consultado el 1 de octubre de 2026:
  - BASIC: $1,490 MXN/mes, 15–50 viviendas.
  - STANDARD: $2,990 MXN/mes, 51–100 viviendas.
  - PROFESSIONAL: $4,990 MXN/mes, 101–250 viviendas.
  - ENTERPRISE: $8,990 MXN/mes, 251–800 viviendas.
- Imágenes estáticas: `logo.png`, `og-image.png`, `icon-192.png`, `icon-512.png` bajo `apps/portal-web/public/`.

## Próximos pasos

- Confirmar en Firebase Console que `www.dommia.com.mx` terminó la emisión del certificado; probar HTTPS y la redirección a `dommia.com.mx`.
- Comprobar que `NEXT_PUBLIC_GA_ID` contenga el Measurement ID de Firebase/GA4 al momento de ejecutar el build. No registrar ni copiar credenciales o IDs privados en este documento.
- Decidir si el flujo `mailto:` es suficiente para captar leads. Si se necesita captura garantizada, integrar una función o servicio de formularios y guardar/avisar leads sin depender del cliente de correo del visitante.
- Los precios estáticos no siguen cambios del catálogo CRM; actualizar `static-plan-catalog.ts` y volver a publicar cuando los precios cambien.
- Repetir deploy desde la raíz después de cada cambio: `corepack pnpm --filter @dommia/portal-web build:static` y luego `firebase deploy --only hosting --project dommia-saas-ef543`.

## Verificaciones hechas

- Builds normal (`build`) y Firebase (`build:static`) completados.
- Portal exportado servido localmente en `http://localhost:3005/`; se probaron escritorios y 390 px de ancho.
- Ambos formularios generaron `mailto:info@dommia.com.mx` con asunto y cuerpo; no enviaron datos al API.
- Enterprise muestra $8,990 MXN/mes en modo estático.
- Acceso de administradores no está presente en el HTML estático.
- Firebase sirvió index, logo, Open Graph, iconos, manifest, robots y sitemap.