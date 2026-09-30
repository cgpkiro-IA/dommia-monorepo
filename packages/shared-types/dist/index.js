"use strict";
// ==============================================================================
// DOMMIA SHARED TYPES & DOMAIN CONTRACTS
// ==============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentStatus = exports.PaymentMethod = exports.ChargeStatus = exports.GatewayStatus = exports.InvitationType = exports.AccessType = exports.SubscriptionTier = exports.TenantModule = exports.ResidentClassification = exports.UserRole = void 0;
// ------------------------------------------------------------------------------
// Roles & Authorization (RBAC)
// ------------------------------------------------------------------------------
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["COMMERCIAL_EXEC"] = "COMMERCIAL_EXEC";
    UserRole["SUPPORT"] = "SUPPORT";
    UserRole["TENANT_ADMIN"] = "TENANT_ADMIN";
    UserRole["OPERATOR"] = "OPERATOR";
    UserRole["GUARD"] = "GUARD";
    UserRole["RESIDENT"] = "RESIDENT";
})(UserRole || (exports.UserRole = UserRole = {}));
var ResidentClassification;
(function (ResidentClassification) {
    ResidentClassification["OWNER"] = "OWNER";
    ResidentClassification["TENANT"] = "TENANT";
    ResidentClassification["FAMILY_MEMBER"] = "FAMILY_MEMBER";
})(ResidentClassification || (exports.ResidentClassification = ResidentClassification = {}));
// ------------------------------------------------------------------------------
// Tiers & Modules
// ------------------------------------------------------------------------------
var TenantModule;
(function (TenantModule) {
    TenantModule["FINANCE"] = "FINANCE";
    TenantModule["RESIDENT_APP"] = "RESIDENT_APP";
    TenantModule["ACCESS_QR"] = "ACCESS_QR";
    TenantModule["RFID_UHF"] = "RFID_UHF";
    TenantModule["STRIPE"] = "STRIPE";
    TenantModule["STRIPE_CONNECT"] = "STRIPE_CONNECT";
    TenantModule["FINANCE_STRIPE"] = "FINANCE_STRIPE";
    TenantModule["GUARD_CONSOLE"] = "GUARD_CONSOLE";
})(TenantModule || (exports.TenantModule = TenantModule = {}));
var SubscriptionTier;
(function (SubscriptionTier) {
    SubscriptionTier["BASIC"] = "BASIC";
    SubscriptionTier["STANDARD"] = "STANDARD";
    SubscriptionTier["PROFESSIONAL"] = "PROFESSIONAL";
    SubscriptionTier["ENTERPRISE"] = "ENTERPRISE";
})(SubscriptionTier || (exports.SubscriptionTier = SubscriptionTier = {}));
// ------------------------------------------------------------------------------
// Access Control & IoT
// ------------------------------------------------------------------------------
var AccessType;
(function (AccessType) {
    AccessType["RFID"] = "RFID";
    AccessType["DYNAMIC_QR"] = "DYNAMIC_QR";
    AccessType["MANUAL_GUARD"] = "MANUAL_GUARD";
})(AccessType || (exports.AccessType = AccessType = {}));
var InvitationType;
(function (InvitationType) {
    InvitationType["SINGLE"] = "SINGLE";
    InvitationType["RECURRENT"] = "RECURRENT";
    InvitationType["SERVICE"] = "SERVICE";
})(InvitationType || (exports.InvitationType = InvitationType = {}));
// ------------------------------------------------------------------------------
// Hardware & Gateways
// ------------------------------------------------------------------------------
var GatewayStatus;
(function (GatewayStatus) {
    GatewayStatus["ONLINE"] = "ONLINE";
    GatewayStatus["OFFLINE"] = "OFFLINE";
    GatewayStatus["MAINTENANCE"] = "MAINTENANCE";
    GatewayStatus["ALERT"] = "ALERT";
})(GatewayStatus || (exports.GatewayStatus = GatewayStatus = {}));
// ------------------------------------------------------------------------------
// Finance & Stripe
// ------------------------------------------------------------------------------
var ChargeStatus;
(function (ChargeStatus) {
    ChargeStatus["PENDING"] = "PENDING";
    ChargeStatus["PAID"] = "PAID";
    ChargeStatus["OVERDUE"] = "OVERDUE";
    ChargeStatus["CANCELLED"] = "CANCELLED";
})(ChargeStatus || (exports.ChargeStatus = ChargeStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["MANUAL_TRANSFER"] = "MANUAL_TRANSFER";
    PaymentMethod["STRIPE_CARD"] = "STRIPE_CARD";
    PaymentMethod["STRIPE_SPEI"] = "STRIPE_SPEI";
    PaymentMethod["CASH"] = "CASH";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    PaymentStatus["APPROVED"] = "APPROVED";
    PaymentStatus["REJECTED"] = "REJECTED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
//# sourceMappingURL=index.js.map