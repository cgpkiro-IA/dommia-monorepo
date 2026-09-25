export interface PlanItem {
  id: string;
  code: string;
  name: string;
  description: string;
  monthly_price: string;
  max_properties: number;
  price_per_extra_property: string;
  includes_custom_domain: boolean;
  custom_domain_addon_price: string;
  standard_domain_pattern: string;
  included_modules: string[];
  available_addons: Array<{ code: string; name: string; price: number }>;
  is_active: boolean;
  is_highlighted: boolean;
  sort_order: number;
  updated_at: string;
}

export interface TenantItem {
  id: string;
  slug: string;
  name: string;
  subdomain: string;
  tier: string;
  max_properties: number;
  is_active: boolean;
  modules?: string[] | Record<string, boolean>;
  contact_email?: string;
  contact_name?: string;
  has_custom_domain?: boolean;
  custom_domain?: string | null;
  access_url?: string;
  created_at: string;
}


export type ProspectStage = 'LEAD' | 'CONTACTED' | 'DEMO' | 'PROPOSAL' | 'WON' | 'LOST';

export interface ProspectItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  community_name: string;
  estimated_houses: number;
  stage: ProspectStage;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface GatewayItem {
  id: string;
  uuid: string;
  name: string;
  status: string;
  dynamic_status: 'ONLINE' | 'OFFLINE';
  last_heartbeat: string | null;
  seconds_since_heartbeat?: number;
  firmware_version: string;
  ip_local?: string;
  notes?: string;
  tenant_name?: string;
  tenant_slug?: string;
}

export interface MetricsData {
  financials: {
    mrr: number;
    arr: number;
    currency: string;
    churnRate: number;
    tierBreakdown: Record<string, number>;
  };
  communities: {
    totalTenants: number;
    activeTenants: number;
    totalHouses: number;
  };
  pipeline: {
    totalProspects: number;
    funnel: Record<string, number>;
    conversionRate: number;
  };
  iot: {
    totalGateways: number;
    onlineGateways: number;
    offlineGateways: number;
  };
}

export interface FeedbackNotification {
  type: 'success' | 'error';
  message: string;
}

export const STAGES = [
  { key: 'LEAD', label: 'Leads (Nuevos)', color: 'border-t-blue-500 bg-blue-50/30' },
  { key: 'CONTACTED', label: 'Contactados', color: 'border-t-amber-500 bg-amber-50/30' },
  { key: 'DEMO', label: 'Demostración', color: 'border-t-indigo-500 bg-indigo-50/30' },
  { key: 'PROPOSAL', label: 'Cotización', color: 'border-t-purple-500 bg-purple-50/30' },
  { key: 'WON', label: 'Cierre Ganado', color: 'border-t-emerald-500 bg-emerald-50/30' },
] as const;
