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
    validUntil: string;
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