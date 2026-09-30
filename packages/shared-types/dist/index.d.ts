export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",// Operador SaaS Dommia Global
    COMMERCIAL_EXEC = "COMMERCIAL_EXEC",// Ejecutivo de Ventas Dommia
    SUPPORT = "SUPPORT",// Soporte Técnico Dommia
    TENANT_ADMIN = "TENANT_ADMIN",// Administrador de Fraccionamiento
    OPERATOR = "OPERATOR",// Operador Administrativo Local
    GUARD = "GUARD",// Guardia de Seguridad en Caseta
    RESIDENT = "RESIDENT"
}
export declare enum ResidentClassification {
    OWNER = "OWNER",
    TENANT = "TENANT",
    FAMILY_MEMBER = "FAMILY_MEMBER"
}
export declare enum TenantModule {
    FINANCE = "FINANCE",
    RESIDENT_APP = "RESIDENT_APP",
    ACCESS_QR = "ACCESS_QR",
    RFID_UHF = "RFID_UHF",
    STRIPE = "STRIPE",
    STRIPE_CONNECT = "STRIPE_CONNECT",
    FINANCE_STRIPE = "FINANCE_STRIPE",
    GUARD_CONSOLE = "GUARD_CONSOLE"
}
export declare enum SubscriptionTier {
    BASIC = "BASIC",// Hasta 50 casas
    STANDARD = "STANDARD",// Hasta 150 casas
    PROFESSIONAL = "PROFESSIONAL",// Hasta 300 casas
    ENTERPRISE = "ENTERPRISE"
}
export interface TenantModules {
    ACCESS_QR?: boolean;
    NOTIFICATIONS_PREMIUM?: boolean;
    finance: boolean;
    rfid: boolean;
    dynamic_qr: boolean;
    whatsapp: boolean;
    stripe_auto: boolean;
}
export interface Tenant {
    id: string;
    slug: string;
    name: string;
    subdomain: string;
    tier: SubscriptionTier;
    maxProperties: number;
    isActive: boolean;
    modules: TenantModules;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Property {
    id: string;
    street: string;
    exteriorNumber: string;
    interiorNumber?: string;
    block?: string;
    lot?: string;
    notes?: string;
    isDelinquent: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Resident {
    id: string;
    propertyId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: ResidentClassification;
    isPrimary: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Vehicle {
    id: string;
    propertyId: string;
    plates: string;
    brand?: string;
    model?: string;
    color?: string;
    createdAt: Date;
}
export declare enum AccessType {
    RFID = "RFID",
    DYNAMIC_QR = "DYNAMIC_QR",
    MANUAL_GUARD = "MANUAL_GUARD"
}
export declare enum InvitationType {
    SINGLE = "SINGLE",
    RECURRENT = "RECURRENT",
    SERVICE = "SERVICE"
}
export interface RfidTag {
    id: string;
    propertyId: string;
    vehicleId?: string;
    tagCode: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
}
export interface DynamicQrPayload {
    tenantId: string;
    propertyId: string;
    invitationId: string;
    timestamp: number;
    totp: string;
    signature: string;
}
export interface Invitation {
    id: string;
    propertyId: string;
    residentId: string;
    visitorName: string;
    visitorPhone?: string;
    invitationType: InvitationType;
    validFrom: Date;
    validUntil: Date;
    totpSecret: string;
    isActive: boolean;
    usedAt?: Date;
    createdAt: Date;
}
export interface AccessLog {
    id: string;
    accessType: AccessType;
    identifier: string;
    propertyId?: string;
    isGranted: boolean;
    rejectionReason?: string;
    gatewayUuid?: string;
    timestamp: Date;
}
export declare enum GatewayStatus {
    ONLINE = "ONLINE",
    OFFLINE = "OFFLINE",
    MAINTENANCE = "MAINTENANCE",
    ALERT = "ALERT"
}
export interface GatewayDevice {
    id: string;
    uuid: string;
    tenantId?: string;
    name: string;
    certificateFingerprint?: string;
    status: GatewayStatus;
    lastHeartbeat?: Date;
    firmwareVersion: string;
    ipLocal?: string;
    notes?: string;
    createdAt: Date;
}
export interface GatewayHeartbeat {
    gatewayUuid: string;
    tenantId: string;
    timestamp: number;
    firmwareVersion: string;
    ipLocal: string;
    cpuTemp?: number;
    diskUsagePercent: number;
    pendingSyncCount: number;
}
export declare enum ChargeStatus {
    PENDING = "PENDING",
    PAID = "PAID",
    OVERDUE = "OVERDUE",
    CANCELLED = "CANCELLED"
}
export declare enum PaymentMethod {
    MANUAL_TRANSFER = "MANUAL_TRANSFER",
    STRIPE_CARD = "STRIPE_CARD",
    STRIPE_SPEI = "STRIPE_SPEI",
    CASH = "CASH"
}
export declare enum PaymentStatus {
    PENDING_APPROVAL = "PENDING_APPROVAL",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export interface FinancialCharge {
    id: string;
    propertyId: string;
    concept: string;
    amount: number;
    dueDate: string;
    status: ChargeStatus;
    createdAt: Date;
    updatedAt: Date;
}
export interface FinancialPayment {
    id: string;
    propertyId: string;
    chargeId?: string;
    amount: number;
    paymentMethod: PaymentMethod;
    reference?: string;
    receiptUrl?: string;
    status: PaymentStatus;
    approvedBy?: string;
    paidAt: Date;
    createdAt: Date;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    metadata?: {
        timestamp: string;
        tenantId?: string;
        requestId?: string;
    };
}
//# sourceMappingURL=index.d.ts.map