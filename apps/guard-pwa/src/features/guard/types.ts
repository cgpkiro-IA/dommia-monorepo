export type GuardSession = {
  token: string;
  tenantSlug: string;
  tenantName: string;
};

export type AccessResult = {
  authorized: boolean;
  manualOverride?: boolean;
  manualAccess?: boolean;
  authorizationMethod?: 'CALL_CONFIRMED';
  manualOverrideToken?: string;
  justification?: string;
  notificationStatus?: 'SENT_WHATSAPP' | 'SENT_EMAIL' | 'NOT_CONFIGURED' | 'FAILED';
  reason?: string;
  visitorName?: string;
  propertyId?: string;
  propertyAddress?: string;
  hostName?: string;
  requiresManualReview?: boolean;
};

export type ResultState = {
  kind: 'authorized' | 'denied' | 'review' | 'error';
  data?: AccessResult;
  message?: string;
};

export type GuardLookupItem = {
  id: string;
  propertyId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  isPrimary?: boolean;
  isActive?: boolean;
  propertyAddress?: string;
  isDelinquent?: boolean;
  plates?: string;
  brand?: string;
  model?: string;
  color?: string;
  residentId?: string;
  residentName?: string;
  classification?: string;
  flagReason?: string;
  blocked?: boolean;
  activePasses?: Array<{
    id: string;
    visitorName: string;
    passType: string;
    validFrom?: string;
    validUntil: string;
    status?: 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';
    usedAt?: string;
    notes?: string;
  }>;
};

export type GuardLookupResult = {
  query: string;
  total: number;
  residents: GuardLookupItem[];
  vehicles: GuardLookupItem[];
  checkedBy?: string;
};

export type ManualVisitCandidate = {
  invitationId: string;
  visitorName: string;
  passType: string;
  validFrom: string;
  validUntil: string;
  isCurrentlyValid: boolean;
  notes?: string;
  propertyId: string;
  propertyAddress: string;
  hostName: string;
  hostPhone?: string;
};

export type ManualVisitPropertySuggestion = {
  propertyId: string;
  propertyAddress: string;
};

export type GuardHistoryEvent = {
  id: string;
  type: string;
  title: string;
  details?: string;
  property_address?: string;
  actor_name?: string;
  occurred_at: string;
};

export type GuardIncidentType = 'SECURITY' | 'SUSPICIOUS_VEHICLE' | 'MEDICAL' | 'FIRE' | 'MAINTENANCE' | 'OTHER';
export type GuardIncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type GuardDelivery = {
  id: string;
  recipientName: string;
  propertyAddress: string;
  carrier: string;
  trackingCode?: string;
  notes?: string;
  status: 'PENDING' | 'COLLECTED';
  receivedAt: string;
  collectedByName?: string;
  collectedAt?: string;
};

export type GuardServiceType =
  | 'FOOD_DELIVERY'
  | 'GAS_SUPPLY'
  | 'WATER_SUPPLY'
  | 'PARCEL_COURIER'
  | 'TAXI_RIDE'
  | 'MAINTENANCE'
  | 'OTHER';

export type GuardServiceDestination = {
  propertyId: string;
  propertyAddress: string;
  residentId?: string;
  residentName?: string;
  residentPhone?: string;
  residentEmail?: string;
};

export type GuardAccessPoint = {
  id: string;
  name: string;
};

export type GuardServiceItem = {
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
};