import { DatabaseService } from '../../../database/database.service';
import { ResidentAppPushTokenDto } from '../dto/resident-app-auth.dto';
import { ResidentSessionClaims } from '../guards/resident-auth.guard';
export declare class AuthRepository {
    private readonly db;
    constructor(db: DatabaseService);
    registerResidentPushToken(claims: ResidentSessionClaims, dto: ResidentAppPushTokenDto): Promise<any>;
    revokeResidentPushToken(claims: ResidentSessionClaims, deviceId: string): Promise<any>;
    recordResidentAudit(slug: string, action: string, entityId: string | null, metadata?: Record<string, unknown>): Promise<void>;
    createResidentInvitation(slug: string, residentId: string, createdBy?: string): Promise<any>;
    createResidentSession(jti: string, residentId: string, tenantSlug: string, expiresAt: Date): Promise<void>;
    createResidentAppSession(input: {
        jti: string;
        residentId: string;
        tenantSlug: string;
        clientType: 'ANDROID' | 'IOS';
        deviceId?: string;
        deviceName?: string;
        refreshTokenHash: string;
        refreshExpiresAt: Date;
        refreshAbsoluteExpiresAt: Date;
    }): Promise<{
        id: string;
        jti: string;
    }>;
    rotateResidentAppRefreshToken(currentTokenHash: string, nextTokenHash: string): Promise<{
        kind: "INVALID";
        residentId?: undefined;
        tenantSlug?: undefined;
        clientType?: undefined;
        session?: undefined;
        refreshExpiresAt?: undefined;
    } | {
        kind: "EXPIRED";
        residentId?: undefined;
        tenantSlug?: undefined;
        clientType?: undefined;
        session?: undefined;
        refreshExpiresAt?: undefined;
    } | {
        kind: "REPLAY";
        residentId: string;
        tenantSlug: string;
        clientType: "ANDROID" | "IOS";
        session?: undefined;
        refreshExpiresAt?: undefined;
    } | {
        kind: "ROTATED";
        session: {
            id: any;
            jti: any;
            residentId: any;
            tenantSlug: any;
            clientType: any;
            deviceId: any;
            deviceName: any;
        };
        refreshExpiresAt: Date;
        residentId?: undefined;
        tenantSlug?: undefined;
        clientType?: undefined;
    }>;
    listResidentAppSessions(residentId: string, tenantSlug: string, currentJti: string): Promise<any[]>;
    revokeResidentAppSession(sessionId: string, residentId: string, tenantSlug: string): Promise<boolean>;
    isResidentSessionActive(jti: string, residentId: string, tenantSlug: string): Promise<boolean>;
    revokeResidentSession(jti: string): Promise<void>;
    revokeAllResidentAppSessions(residentId: string, tenantSlug: string): Promise<number>;
    activateResident(token: string, password: string): Promise<{
        resident: any;
        tenantSlug: any;
    }>;
    findResidentByCredentials(slug: string, identifier: string, password: string): Promise<any>;
    findResidentProfile(slug: string, residentId: string): Promise<any>;
    changeResidentPassword(slug: string, identifier: string, currentPassword: string, newPassword: string): Promise<any>;
    createResidentPasswordReset(slug: string, identifier: string): Promise<any>;
    resetResidentPassword(token: string, newPassword: string): Promise<any>;
    findUserByEmailAndPassword(email: string, passwordPlain: string): Promise<any>;
    findUserForMfa(userId: string): Promise<any>;
    verifyUserPassword(userId: string, password: string): Promise<boolean>;
    getMfaSettings(userId: string): Promise<any>;
    savePendingMfaSecret(userId: string, encryptedSecret: string): Promise<void>;
    enableMfa(userId: string, step: number): Promise<boolean>;
    disableMfa(userId: string, step: number): Promise<boolean>;
    createMfaChallenge(userId: string, expiresAt: Date): Promise<string>;
    findActiveMfaChallenge(challengeId: string, userId: string): Promise<any>;
    recordFailedMfaChallenge(challengeId: string): Promise<void>;
    consumeMfaChallenge(challengeId: string, userId: string): Promise<boolean>;
    consumeMfaStep(userId: string, step: number): Promise<boolean>;
    findAllActiveTenants(): Promise<any[]>;
    findTenantsByUser(userId: string, userRole: string, tenantId?: string): Promise<any[]>;
}
