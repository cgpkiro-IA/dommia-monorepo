# SaaS Modular para Fraccionamientos (Versión Final Recomendada)

## Objetivos Estratégicos
El producto estará compuesto por TRES plataformas independientes pero integradas:

### 1. Portal Operativo del Fraccionamiento
Dirigido a:
- Administradores
- Guardias
- Residentes

Funciones:
- Operación diaria.
- Finanzas.
- Accesos.
- Invitaciones.
- Comunicación.
- Reportes.

### 2. CRM Maestro SaaS (Backoffice Comercial)
Dirigido exclusivamente al operador del negocio SaaS.

Funciones:
- Prospectos.
- Clientes.
- Activaciones.
- Facturación global.
- Seguimiento comercial.
- Renovaciones.
- Gestión de hardware.
- Monitoreo de Gateways.
- Alertas operativas.
- Métricas de adopción.
- Soporte.

### 3. Infraestructura IoT Distribuida
Compuesta por:
- Gateways.
- Lectores RFID.
- Lectores QR.
- Controladoras.
- MQTT.

---

# Arquitectura de Alto Nivel

## Capa Comercial (CRM Maestro)
Módulos:
- Dashboard Ejecutivo.
- Prospectos.
- Pipeline Comercial.
- Clientes Activos.
- Contratos.
- Suscripciones.
- Inventario de Hardware.
- Tickets de Soporte.
- Facturación.
- Centro de Alertas.

KPIs:
- MRR.
- ARR.
- Churn.
- Clientes activos.
- Fraccionamientos activos.
- Casas administradas.
- Gateways online.
- Gateways offline.
- Cobranza procesada.

---

## Capa Operativa del Fraccionamiento

### Administración
- Propiedades.
- Residentes.
- Arrendatarios.
- Vehículos.
- TAGs.
- Usuarios.
- Roles.

### Finanzas
- Cuotas.
- Recargos.
- Descuentos.
- Conciliación.
- Estados de cuenta.
- Historial.

### Accesos
- RFID.
- QR dinámico.
- Accesos manuales.
- Lista negra.
- Bloqueos.

### Comunicación
- Avisos.
- Notificaciones.
- WhatsApp.
- Correo.
- Push.

---

# Seguridad

## RBAC Obligatorio
Roles mínimos:
- SuperAdmin SaaS.
- Ejecutivo Comercial.
- Soporte.
- Administrador Fraccionamiento.
- Operador Administrativo.
- Guardia.
- Residente.

## MFA
La decisión vigente es MFA TOTP opcional por cuenta para SuperAdmin, equipo CRM y administradores de fraccionamiento. El usuario configura Microsoft Authenticator desde Seguridad en CRM o Communities, con reautenticación, QR/clave manual y validación inicial antes de activar. Una vez activo, se solicita después de la contraseña en el siguiente login.

El cifrado de secretos, protección contra replay y requisito de `MFA_ENCRYPTION_KEY` están documentados en [Protocolo de Seguridad](./Protocolo%20de%20Seguridad%20y%20Proteccion%20de%20Propiedad%20Intelectual.md). La versión y validación local se registran en el [Plan de Desarrollo vigente](../Planes/Plan%20de%20Desarrollo%20Maestro%20por%20Fases.md).

## Auditoría
Registrar:
- Quién.
- Cuándo.
- Desde qué IP.
- Qué cambió.
- Valor anterior.
- Valor nuevo.

---

# Device Management

Cada Gateway debe tener:
- UUID.
- Certificado único.
- Tenant asignado.
- Firmware.
- Estado.
- Última conexión.

Capacidades:
- OTA.
- Reinicio remoto.
- Diagnóstico remoto.
- Actualización programada.

---

# MQTT Empresarial

Definir:
- QoS por evento.
- TLS.
- Certificados por dispositivo.
- Last Will.
- Heartbeats.
- Reintentos.

---

# Observabilidad

## Logs
- Aplicación.
- Seguridad.
- Finanzas.
- IoT.

## Métricas
- Latencia.
- Errores.
- Conexiones.
- Consumo.

## Alertas
- Gateway offline.
- Stripe fallando.
- MQTT caído.
- Replicación fallando.

---

# Backups y Recuperación

Definir:
- RPO 15 minutos.
- RTO 2 horas.
- Backup diario.
- Backup completo semanal.
- Restauración por tenant.

---

# Cumplimiento y Gobierno

- Términos y condiciones.
- Aviso de privacidad.
- Retención de datos.
- Políticas de acceso.
- Evidencias legales de accesos.

---

# Fase Adicional 0 (Arquitectura)

Antes de programar:
- Modelo RBAC.
- Modelo multi-tenant.
- MQTT.
- Observabilidad.
- CI/CD.
- Backups.
- Seguridad.

---

# Nuevas Fases

## Fase 1
Landing + CRM Maestro.

## Fase 2
Administración de fraccionamiento.

## Fase 3
Finanzas.

## Fase 4
Stripe.

## Fase 5
IoT.

## Fase 6
QR dinámico.

## Fase 7
Analítica avanzada.

---

# Tableros del CRM Maestro

## Dashboard Ejecutivo
- Ventas.
- Activaciones.
- Renovaciones.
- MRR.
- ARR.

## Dashboard Operativo
- Gateways online.
- Gateways offline.
- Dispositivos sin sincronizar.
- Casetas con incidencias.

## Dashboard Financiero
- Facturación.
- Cobranza.
- Morosidad.
- Comisiones.

## Dashboard Soporte
- Tickets abiertos.
- SLA.
- Tiempo de resolución.

---

# Recomendación para Go-Live

Este documento contiene recomendaciones de arquitectura de la etapa inicial y no es un bloqueo para continuar el desarrollo. El roadmap vigente está en [Plan de Desarrollo Maestro por Fases](../Planes/Plan%20de%20Desarrollo%20Maestro%20por%20Fases.md).

Antes de habilitar clientes en producción, cerrar o aceptar formalmente los riesgos de:
1. Arquitectura de roles.
2. Arquitectura CRM Maestro.
3. Device Management.
4. OTA.
5. Observabilidad.
6. Backups.
7. Seguridad.
8. Auditoría.
9. SLA.
10. Gobierno de datos.

La integración de dispositivos y plumas (Fase 5) permanece detenida hasta verificar compatibilidad por caseta. Stripe es opcional y solo se habilita con entitlement contratado; los pagos del MVP se validan manualmente por SPEI o se registran en efectivo.

Estos controles son criterios de preparación para producción, no requisitos para iniciar o continuar el MVP.
