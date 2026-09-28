export type ResidentRole = 'OWNER' | 'TENANT' | 'FAMILY_MEMBER';

export type PaymentStatus = 'UP_TO_DATE' | 'OVERDUE';
export type AccountStatus = 'UP_TO_DATE' | 'OVERDUE' | 'CREDIT_BALANCE';

export interface ResidentProfile {
  id: string;
  propertyId?: string;
  name: string;
  email: string;
  phone: string;
  communitySlug: string;
  communityName: string;
  propertyAddress: string; // e.g. "Privada Los Robles #142"
  role: ResidentRole;
  isPrimary: boolean;
  paymentStatus: PaymentStatus;
  avatarUrl?: string;
  updatedAt: string;
  modules?: string[] | Record<string, boolean>;
}

export interface ResidentCharge {
  id: string;
  concept: string;
  amount: string | number;
  balance_due: string | number;
  due_date: string;
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'CANCELLED';
  period_year?: number;
  period_month?: number;
}

export interface ResidentPayment {
  id: string;
  property_id?: string;
  charge_id?: string | null;
  amount: string | number;
  payment_method: string;
  reference: string;
  receipt_url?: string | null;
  paid_at: string;
  status: string;
  received_by_name?: string;
  payer_name?: string;
  notes?: string;
}

export interface ResidentFinancialStatus {
  propertyId: string;
  totalBalanceDue: number;
  totalCharged?: number;
  totalPaid?: number;
  creditBalance?: number;
  accountStatus?: AccountStatus;
  hasPendingCharges: boolean;
  pendingChargesCount: number;
  charges: ResidentCharge[];
  recentPayments: ResidentPayment[];
}

export type PassType = 'SINGLE_USE' | 'TEMPORARY' | 'FREQUENT';

export interface VisitorPass {
  id: string;
  visitorName: string;
  validFrom: string;
  validUntil: string;
  passType: PassType;
  accessCount: number;
  qrPayload: string;
  notes?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  synced: boolean;
  createdAt: string;
}

export interface CommunityNotice {
  id: string;
  title: string;
  content: string;
  category: 'MAINTENANCE' | 'URGENT' | 'ASSEMBLY' | 'GENERAL';
  publishedAt: string;
  author: string;
  isRead: boolean;
}

export interface OfflineSyncQueueItem {
  id: string;
  action: 'CREATE_INVITATION' | 'CANCEL_INVITATION' | 'UPDATE_PROFILE';
  payload: any;
  timestamp: number;
  attempts: number;
}
