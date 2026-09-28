# Notificaciones Premium: SMTP y WhatsApp Business

## Entitlement

El tenant debe tener `NOTIFICATIONS_PREMIUM` dentro de `public.tenants.modules`. Sin ese módulo, el API responde `403` y el administrador no puede consultar ni guardar configuraciones.

## Canales configurables

- `SMTP`: `smtpHost`, `smtpPort`, `smtpSecure`, `smtpUser`, `smtpPassword`, `fromEmail`, `fromName`.
- `WHATSAPP_BUSINESS`: `whatsappAccessToken`, `whatsappPhoneNumberId`, `whatsappBusinessAccountId`, `whatsappApiVersion`.

Las credenciales se almacenan cifradas con `pgcrypto` en `public.notification_channel_configs`. Nunca se devuelven al frontend.

## Variables de entorno

```env
NOTIFICATIONS_ENCRYPTION_KEY=<secreto-largo-y-aleatorio>
```

En producción esta variable es obligatoria. En desarrollo se permite una clave local únicamente para pruebas.

## API administrativa

```text
GET    /api/v1/tenants/:slug/notifications/config
PATCH  /api/v1/tenants/:slug/notifications/config
DELETE /api/v1/tenants/:slug/notifications/config/:channel
```

Las rutas requieren sesión administrativa con rol `SUPER_ADMIN`, `TENANT_ADMIN` u `OPERATOR`, además del entitlement `NOTIFICATIONS_PREMIUM`.

La configuración solamente prepara los canales. El envío efectivo de invitaciones requiere implementar los adaptadores SMTP y WhatsApp Business, junto con plantillas, reintentos, auditoría y límites de envío.
