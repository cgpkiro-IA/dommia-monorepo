const PLAN_MODULE_OPTIONS = [
  { code: 'directory', label: 'Viviendas y residentes', description: 'Padrón, directorio y administración residencial.' },
  { code: 'finance', label: 'Finanzas y cuotas', description: 'Cargos y registro de pagos manuales.' },
  { code: 'resident_pwa', label: 'Dommia Resident (PWA)', description: 'Portal web para residentes.' },
  { code: 'visitor_log', label: 'Bitácora de visitas', description: 'Registro manual de visitas en caseta.' },
  { code: 'notices', label: 'Avisos y comunicados', description: 'Comunicación oficial de la comunidad.' },
  { code: 'incidents', label: 'Incidencias', description: 'Registro y seguimiento de reportes.' },
  { code: 'dynamic_qr', label: 'Pases QR dinámicos', description: 'Invitaciones digitales con código temporal.' },
  { code: 'guard_console', label: 'Consola de guardia', description: 'Flujo digital de acceso para caseta.' },
  { code: 'bank_reconciliation', label: 'Revisión de pagos SPEI', description: 'Validación por referencia y comprobante.' },
] as const;

type PlanModuleCode = (typeof PLAN_MODULE_OPTIONS)[number]['code'];

const planModuleToTenantModule: Partial<Record<PlanModuleCode, string>> = {
  directory: 'DIRECTORY',
  finance: 'FINANCE',
  resident_pwa: 'RESIDENT_APP',
  visitor_log: 'VISITOR_LOG',
  notices: 'NOTICES',
  incidents: 'INCIDENTS',
  dynamic_qr: 'ACCESS_QR',
  guard_console: 'GUARD_CONSOLE',
  bank_reconciliation: 'BANK_RECONCILIATION',
};

const planModuleLabels = new Map(PLAN_MODULE_OPTIONS.map(({ code, label }) => [code, label]));

export const TENANT_MODULE_OPTIONS = PLAN_MODULE_OPTIONS.flatMap((module) => {
  const key = planModuleToTenantModule[module.code];
  return key ? [{ key, label: module.label }] : [];
});

export { PLAN_MODULE_OPTIONS };

export function getTenantModulesForPlan(moduleCodes: string[]) {
  return [...new Set(moduleCodes.flatMap((code) => {
    if (!Object.prototype.hasOwnProperty.call(planModuleToTenantModule, code)) return [];
    const tenantModule = planModuleToTenantModule[code as PlanModuleCode];
    return tenantModule ? [tenantModule] : [];
  }))];
}

export function getPlanModuleLabel(code: string) {
  return planModuleLabels.get(code as (typeof PLAN_MODULE_OPTIONS)[number]['code'])
    ?? code.replace(/[_-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}