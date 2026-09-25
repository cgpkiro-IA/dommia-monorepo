// ==============================================================================
// DOMMIA DESIGN SYSTEM TOKENS
// ==============================================================================

export const colors = {
  // Corporativos
  midnight: '#0F172A',      // Midnight Blue (Primario / Dominante)
  royal: '#2563EB',         // Royal Blue (Secundario / Acento / CTA)
  white: '#FFFFFF',         // Blanco puro
  grayBase: '#F8FAFC',      // Gris Base (Fondos neutros)
  slateSubtle: '#64748B',   // Gris texto secundario
  slateBorder: '#E2E8F0',   // Gris bordes y separadores

  // Funcionales
  success: '#10B981',       // Emerald (Acceso permitido / Pagado)
  successBg: '#ECFDF5',
  warning: '#F59E0B',       // Amber (Por vencer / Alerta de gateway)
  warningBg: '#FFFBEB',
  error: '#DC2626',         // Red (Acceso denegado / Moroso)
  errorBg: '#FEF2F2',
} as const;

export const typography = {
  primary: 'Inter, system-ui, -apple-system, sans-serif',
  headings: 'Manrope, system-ui, -apple-system, sans-serif',
} as const;
