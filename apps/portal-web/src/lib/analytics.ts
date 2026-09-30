/**
 * DOMMIA Analytics & Telemetry Hub
 * Compatible con Google Analytics 4 (gtag), Google Tag Manager (dataLayer),
 * y sistemas de eventos personalizados.
 */

declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'set' | 'js',
      actionOrDate: string | Date,
      params?: Record<string, any>
    ) => void;
    dataLayer?: Array<Record<string, any>>;
  }
}

export type AnalyticsEventName =
  | 'page_view'
  | 'calculate_houses_slider'
  | 'select_tier'
  | 'submit_demo_lead'
  | 'start_self_service_provision'
  | 'click_cta'
  | 'faq_expand';

export interface AnalyticsEventParams {
  tier_name?: string;
  houses_count?: number;
  estimated_price?: string;
  community_name?: string;
  mode?: 'demo' | 'self_service';
  cta_name?: string;
  destination?: string;
  [key: string]: any;
}

/**
 * Dispara un evento analítico a los servicios configurados en el navegador.
 */
export function trackEvent(name: AnalyticsEventName, params?: AnalyticsEventParams) {
  if (typeof window === 'undefined') return;

  // 1. Google Analytics 4 (gtag.js)
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }

  // 2. Google Tag Manager (dataLayer)
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: name,
      ...params,
      timestamp: new Date().toISOString(),
    });
  }

  // 3. Registro en desarrollo para depuración y verificación
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[DOMMIA Analytics] Evento: "${name}"`, params || {});
  }
}
