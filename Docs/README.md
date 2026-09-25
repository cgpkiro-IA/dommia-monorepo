# 📚 Documentación Oficial - DOMMIA

Índice central de la documentación técnica, arquitectónica y comercial del ecosistema **DOMMIA** (*El Sistema Operativo de tu Comunidad*).

---

## 🏛️ 1. [Arquitectura](./Arquitectura/)
Documentos de referencia sobre la estructura del sistema, responsabilidades de capas y diseño técnico:
* **[Saas Modular Frac Arquitectura.md](./Arquitectura/Saas%20Modular%20Frac%20Arquitectura.md):** Arquitectura C4 (Contexto, Contenedores, Componentes), ADR-001 (Redis post-MVP), aislamiento multi-tenant por Schemas de PostgreSQL y principios rectores.
* **[Anexo A - Arquitectura.md](./Arquitectura/Anexo%20A%20-%20Arquitectura.md):** Guía de responsabilidades tecnológicas frontend y backend (React vs Next.js vs PWA vs Service Workers vs IndexedDB vs SQLite vs PostgreSQL).
* **[SaaS Modular Frac Recomendaciones.md](./Arquitectura/SaaS%20Modular%20Frac%20Recomendaciones.md):** Estrategia de triple plataforma (CRM Maestro, Portal Fraccionamiento e IoT Caseta), requerimientos de seguridad (MFA, RBAC, auditoría) y gobierno de datos.

---

## 🎨 2. [Marca & Diseño](./Marca/)
Lineamientos de identidad visual, directrices de comunicación y tono de voz:
* **[Saas Modular Frac Marca.md](./Marca/Saas%20Modular%20Frac%20Marca.md):** Manual de Marca corporativo de DOMMIA. Definición del ecosistema de 8 productos, paleta de colores (Midnight Blue `#0F172A`, Royal Blue `#2563EB`, etc.), tipografías (`Inter` y `Manrope`), isotipo (D + Hogar + Nodo Digital) y propuesta de valor comercial.

---

## 🗺️ 3. [Planes & Roadmap](./Planes/)
Planificación de ingeniería, seguimiento de entregables y roadmap de producción:
* **[Plan de Desarrollo Maestro por Fases.md](./Planes/Plan%20de%20Desarrollo%20Maestro%20por%20Fases.md):** **(Documento Vivo Principal)** Bitácora de versiones, mapa de ruta de las Fases 0 a 7, checklists de tareas técnicas con criterios de aceptación y estado en tiempo real.
* **[SaaS Modular Frac Plan Maestro.md](./Planes/SaaS%20Modular%20Frac%20Plan%20Maestro.md):** Plan de trabajo maestro v3 para producción con detalle del kit IoT estandarizado (Wiegand 26/34 bits) y algoritmos antifallos en caseta.

---

## 🧪 4. Guía de Pruebas & Operación
* Consulta la carpeta **[`/Testing`](../Testing/)** en la raíz del proyecto para instrucciones operativas, reinicio de servicios en Docker y catálogo de usuarios demo para pruebas.
