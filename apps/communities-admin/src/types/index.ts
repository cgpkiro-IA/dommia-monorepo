export interface Property {
  id: string;
  street: string;
  exterior_number: string;
  interior_number: string | null;
  block: string | null;
  lot: string | null;
  notes: string | null;
  is_delinquent: boolean;
  created_at: string;
  updated_at?: string;
  residents_count?: number;
  vehicles_count?: number;
  primary_resident_name?: string | null;
  primary_resident_phone?: string | null;
  primary_resident_email?: string | null;
}

export interface Resident {
  id: string;
  property_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: 'OWNER' | 'TENANT' | 'FAMILY_MEMBER';
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  street: string;
  exterior_number: string;
  interior_number: string | null;
  block: string | null;
  lot: string | null;
}

export interface Vehicle {
  id: string;
  property_id: string;
  resident_id: string | null;
  plates: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  created_at: string;
  street: string;
  exterior_number: string;
  interior_number: string | null;
  block: string | null;
  lot: string | null;
  resident_first_name: string | null;
  resident_last_name: string | null;
}

export interface TenantMetadata {
  id: string;
  slug: string;
  name: string;
  tier: string;
  maxProperties: number;
  accessUrl: string;
  hasCustomDomain: boolean;
  customDomain: string | null;
  modules?: string[] | Record<string, boolean>;
  role?: string;
}

export interface Metrics {
  total: number;
  maxAllowed: number;
  remaining: number;
  usagePercentage: number;
  isLimitReached: boolean;
  delinquentCount: number;
  upToDateCount: number;
  totalResidents?: number;
  ownersCount?: number;
  tenantsCount?: number;
  familyCount?: number;
  totalVehicles?: number;
}

export interface UserSession {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  tenants: TenantMetadata[];
  activeTenant: TenantMetadata | null;
  token: string;
}

export interface NotificationToast {
  type: 'success' | 'error';
  message: string;
}

export type NoticeCategory = 'URGENT' | 'MAINTENANCE' | 'ASSEMBLY' | 'GENERAL' | 'GUARD_CONSIGN' | 'SECURITY';
export type NoticePriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type NoticeAudience = 'ALL' | 'RESIDENTS' | 'GUARDS';

export interface CommunityNotice {
  id: string;
  title: string;
  content: string;
  category: NoticeCategory;
  priority: NoticePriority;
  target_audience?: NoticeAudience;
  acknowledged_guards?: Array<{ guardId: string; guardName: string; acknowledgedAt: string }>;
  expires_at?: string | null;
  author_name: string;
  is_pinned: boolean;
  is_published: boolean;
  published_at: string;
  created_at: string;
  updated_at?: string;
}

export interface NoticeFormData {
  title: string;
  content: string;
  category: NoticeCategory;
  priority: NoticePriority;
  target_audience: NoticeAudience;
  author_name: string;
  is_pinned: boolean;
  is_published: boolean;
}

export type FeeType = 'FIXED_RECURRENT' | 'VARIABLE_LOT_SIZE' | 'EXTRAORDINARY';
export type FeeFrequency = 'MONTHLY' | 'BI_MONTHLY' | 'ANNUAL' | 'ONE_TIME';
export type LateFeeType = 'NONE' | 'PERCENTAGE' | 'FIXED';
export type EarlyBirdDiscountType = 'NONE' | 'PERCENTAGE' | 'FIXED';

export interface FeeConfiguration {
  id: string;
  name: string;
  fee_type: FeeType;
  base_amount: string | number;
  frequency: FeeFrequency;
  due_day: number;
  grace_days: number;
  late_fee_type: LateFeeType;
  late_fee_amount: string | number;
  early_bird_discount_type: EarlyBirdDiscountType;
  early_bird_discount_amount: string | number;
  early_bird_deadline_day: number | null;
  applies_to_all_properties: boolean;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at?: string;
}

export interface FeeFormData {
  name: string;
  feeType: FeeType;
  baseAmount: number;
  frequency: FeeFrequency;
  dueDay: number;
  graceDays: number;
  lateFeeType: LateFeeType;
  lateFeeAmount: number;
  earlyBirdDiscountType: EarlyBirdDiscountType;
  earlyBirdDiscountAmount: number;
  earlyBirdDeadlineDay?: number;
  appliesToAllProperties: boolean;
  isActive: boolean;
  description?: string;
}

export interface FeeSimulationResult {
  feeSummary: {
    id: string;
    name: string;
    feeType: string;
    baseAmount: number;
    frequency: string;
    dueDay: number;
    graceDays: number;
    lateFeePolicy: string;
    earlyBirdPolicy: string;
  };
  projection: {
    totalPropertiesCount: number;
    projectedBaseRevenue: number;
    projectedEarlyBirdRevenue: number;
    projectedLateRevenue: number;
    averageFeePerProperty: number;
  };
  propertiesSample: Array<{
    propertyId: string;
    address: string;
    lotSizeM2: number;
    isDelinquent: boolean;
    baseFee: number;
    discountAmount: number;
    earlyBirdTotal: number;
    surchargeAmount: number;
    lateTotal: number;
  }>;
}

export type ChargeStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'SPEI_TRANSFER' | 'BANK_DEPOSIT' | 'STRIPE_CARD';

export interface FinancialCharge {
  id: string;
  property_id: string;
  fee_config_id: string | null;
  concept: string;
  amount: string | number;
  balance_due: string | number;
  due_date: string;
  period_year?: number;
  period_month?: number;
  status: ChargeStatus;
  notes?: string | null;
  created_at: string;
  street?: string;
  exterior_number?: string;
  interior_number?: string;
  primary_resident_name?: string;
  primary_resident_phone?: string;
}

export interface FinancialPayment {
  id: string;
  property_id: string;
  charge_id: string | null;
  amount: string | number;
  payment_method: PaymentMethod;
  reference: string;
  receipt_url?: string | null;
  status: 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';
  received_by_name: string;
  payer_name?: string | null;
  notes?: string | null;
  paid_at: string;
  created_at: string;
  street?: string;
  exterior_number?: string;
  charge_concept?: string;
}

export interface FinancialSummaryData {
  totalCollectedMonth: number;
  paymentsCount: number;
  cashCollected: number;
  speiCollected: number;
  totalPendingAmount: number;
  totalOverdueAmount: number;
  overdueChargesCount: number;
  totalProperties: number;
  delinquentPropertiesCount: number;
  upToDatePropertiesCount: number;
}

export interface PaymentFormData {
  propertyId: string;
  chargeId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference: string;
  receivedByName: string;
  payerName: string;
  notes: string;
}

export interface AnnualCampaign {
  id: string;
  name: string;
  discount_percentage: string | number;
  months_covered: number;
  period_start: string;
  period_end: string;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED';
  commitments_count?: number;
  approved_count?: number;
  approved_amount?: string | number;
  approved_discount?: string | number;
}

export interface AnnualCampaignFormData {
  name: string;
  discountPercentage: number;
  monthsCovered: number;
  periodStart: string;
  periodEnd: string;
}

export type GuardServiceType =
  | 'FOOD_DELIVERY'
  | 'GAS_SUPPLY'
  | 'WATER_SUPPLY'
  | 'PARCEL_COURIER'
  | 'TAXI_RIDE'
  | 'MAINTENANCE'
  | 'OTHER';

export interface GuardServiceDestination {
  propertyId: string;
  propertyAddress: string;
  residentId?: string;
  residentName?: string;
  residentPhone?: string;
  residentEmail?: string;
}

export interface GuardServiceItem {
  id: string;
  service_type: GuardServiceType;
  custom_service_name?: string;
  supplier_name?: string;
  vehicle_plates?: string;
  destination_type: 'SPECIFIC' | 'GENERAL';
  destinations: GuardServiceDestination[];
  status: 'IN_TRANSIT' | 'COMPLETED';
  notes?: string;
  entered_by: string;
  entered_by_name?: string;
  entered_access_point_id?: string;
  entered_access_point_name?: string;
  entered_at: string;
  exited_by?: string;
  exited_by_name?: string;
  exited_access_point_id?: string;
  exited_access_point_name?: string;
  exited_at?: string;
}

export type AuditCategoryFilter = 'ALL' | 'ACCESS' | 'SERVICE' | 'INCIDENT' | 'DELIVERY' | 'NOTICE';
export type AuditPeriodFilter = 'TODAY' | 'WEEK' | 'FORTNIGHT' | 'MONTH' | 'CUSTOM';

export interface UnifiedAuditLogItem {
  id: string;
  eventType: string;
  category: 'ACCESS' | 'SERVICE' | 'INCIDENT' | 'DELIVERY' | 'NOTICE';
  title: string;
  description: string;
  propertyAddress?: string;
  vehiclePlates?: string;
  isGranted: boolean;
  status: string;
  rejectionReason?: string;
  notes?: string;
  actorName?: string;
  createdAt: string;
}

export interface UnifiedAuditLogSummary {
  totalEvents: number;
  grantedAccessCount: number;
  rejectedAccessCount: number;
  servicesCount: number;
  incidentsCount: number;
  deliveriesCount: number;
  noticesCount: number;
}




