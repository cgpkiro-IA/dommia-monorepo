import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from '../repositories/auth.repository';
import { LoginDto } from '../dto/login.dto';
import { ResidentActivateDto, ResidentChangePasswordDto, ResidentLoginDto, ResidentPasswordRecoveryRequestDto, ResidentPasswordResetDto } from '../dto/resident-auth.dto';
import { ResidentAppChangePasswordDto, ResidentAppLoginDto, ResidentAppPasswordResetDto } from '../dto/resident-app-auth.dto';
import { NotificationDeliveryService } from '../../notifications/services/notification-delivery.service';
import { InMemoryResidentRateLimiter } from './resident-rate-limiter';
export interface TenantInfo {
    id: string;
    slug: string;
    name: string;
    tier: string;
    maxProperties: number;
    modules: string[] | Record<string, boolean>;
    hasCustomDomain: boolean;
    customDomain: string | null;
    accessUrl: string;
    role: string;
}
export interface AuthSession {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
    };
    tenants: TenantInfo[];
    activeTenant: TenantInfo | null;
    token: string;
}
export interface MfaLoginChallenge {
    mfaRequired: true;
    challengeToken: string;
    expiresIn: number;
}
export declare class AuthService {
    private readonly config;
    private readonly jwtService;
    private readonly authRepo;
    private readonly notificationDelivery;
    private readonly residentRateLimiter;
    private readonly logger;
    constructor(config: ConfigService, jwtService: JwtService, authRepo: AuthRepository, notificationDelivery: NotificationDeliveryService, residentRateLimiter: InMemoryResidentRateLimiter);
    private signClaims;
    private verifySignedClaims;
    private encryptionKey;
    private encryptSecret;
    private decryptSecret;
    private validateTotp;
    private signResidentAppAccessToken;
    private residentAppSigningKey;
    private createResidentAppTokenResponse;
    residentAppLogin(dto: ResidentAppLoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: number;
        refreshExpiresAt: string;
        resident: any;
        tenantSlug: string;
        clientType: "ANDROID" | "IOS";
        deviceId: string;
        deviceName: string;
    } | {
        passwordChangeRequired: boolean;
        tenantSlug: string;
    }>;
    residentAppChangePassword(dto: ResidentAppChangePasswordDto): Promise<{
        revokedSessions: number;
    }>;
    residentAppRefresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: number;
        refreshExpiresAt: string;
        resident: any;
        tenantSlug: string;
        clientType: "ANDROID" | "IOS";
        deviceId: string;
        deviceName: string;
    }>;
    residentAppResetPassword(dto: ResidentAppPasswordResetDto): Promise<{
        success: boolean;
        message: string;
        data: {
            resident: any;
            revokedSessions: number;
        };
    }>;
    residentAppLogout(jti: string): Promise<{
        success: boolean;
    }>;
    listResidentAppSessions(residentId: string, tenantSlug: string, currentJti: string): Promise<any[]>;
    revokeResidentAppSession(sessionId: string, residentId: string, tenantSlug: string): Promise<{
        success: boolean;
    }>;
    private validateResidentPassword;
    private assertResidentRateLimit;
    private assertAdminLoginRateLimit;
    login(dto: LoginDto): Promise<AuthSession | MfaLoginChallenge>;
    private createAuthSession;
    verifyMfaLogin(challengeToken: string, code: string): Promise<AuthSession>;
    getMfaStatus(userId: string): Promise<{
        enabled: boolean;
        setupPending: boolean;
    }>;
    startMfaSetup(userId: string, password: string): Promise<{
        secret: string;
        qrCodeDataUrl: string;
        expiresIn: number;
    }>;
    enableMfa(userId: string, code: string): Promise<{
        enabled: boolean;
    }>;
    disableMfa(userId: string, password: string, code: string): Promise<{
        enabled: boolean;
    }>;
    selectTenant(userId: string, tenantSlug: string): Promise<AuthSession>;
    residentLogin(dto: ResidentLoginDto): Promise<{
        token: string;
        mustChangePassword: any;
        resident: any;
        tenantSlug: string;
    }>;
    residentLogout(jti: string): Promise<{
        success: boolean;
    }>;
    residentProfile(tenantSlug: string, residentId: string): Promise<{
        resident: any;
        tenantSlug: string;
    }>;
    activateResident(dto: ResidentActivateDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    changeResidentPassword(dto: ResidentChangePasswordDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    requestResidentPasswordRecovery(dto: ResidentPasswordRecoveryRequestDto): Promise<{
        success: boolean;
        message: string;
        data: {
            expiresAt?: string;
            resetToken?: string;
        };
    }>;
    resetResidentPassword(dto: ResidentPasswordResetDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
}
