import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { DisableMfaDto, MfaCodeDto, SelectTenantDto, StartMfaSetupDto, VerifyMfaLoginDto } from '../dto/admin-mfa.dto';
import { ResidentActivateDto, ResidentChangePasswordDto, ResidentLoginDto, ResidentPasswordRecoveryRequestDto, ResidentPasswordResetDto } from '../dto/resident-auth.dto';
import { ResidentSessionClaims } from '../guards/resident-auth.guard';
import { AdminSessionClaims } from '../guards/admin-session.guard';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        success: boolean;
        message: string;
        data: import("../services/auth.service").AuthSession | import("../services/auth.service").MfaLoginChallenge;
    }>;
    verifyMfaLogin(dto: VerifyMfaLoginDto): Promise<{
        success: boolean;
        message: string;
        data: import("../services/auth.service").AuthSession;
    }>;
    mfaStatus(request: {
        user: AdminSessionClaims;
    }): Promise<{
        success: boolean;
        data: {
            enabled: boolean;
            setupPending: boolean;
        };
    }>;
    startMfaSetup(request: {
        user: AdminSessionClaims;
    }, dto: StartMfaSetupDto): Promise<{
        success: boolean;
        data: {
            secret: string;
            qrCodeDataUrl: string;
            expiresIn: number;
        };
    }>;
    enableMfa(request: {
        user: AdminSessionClaims;
    }, dto: MfaCodeDto): Promise<{
        success: boolean;
        data: {
            enabled: boolean;
        };
    }>;
    disableMfa(request: {
        user: AdminSessionClaims;
    }, dto: DisableMfaDto): Promise<{
        success: boolean;
        data: {
            enabled: boolean;
        };
    }>;
    selectTenant(request: {
        user: AdminSessionClaims;
    }, dto: SelectTenantDto): Promise<{
        success: boolean;
        data: import("../services/auth.service").AuthSession;
    }>;
    residentLogin(dto: ResidentLoginDto): Promise<{
        success: boolean;
        message: string;
        data: {
            token: string;
            mustChangePassword: any;
            resident: any;
            tenantSlug: string;
        };
    }>;
    residentActivate(dto: ResidentActivateDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    residentProfile(request: {
        user: ResidentSessionClaims;
    }): Promise<{
        success: boolean;
        data: {
            resident: any;
            tenantSlug: string;
        };
    }>;
    residentLogout(request: {
        user: ResidentSessionClaims;
    }): Promise<{
        success: boolean;
    }>;
    residentChangePassword(dto: ResidentChangePasswordDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    residentPasswordRecovery(dto: ResidentPasswordRecoveryRequestDto): Promise<{
        success: boolean;
        message: string;
        data: {
            expiresAt?: string;
            resetToken?: string;
        };
    }>;
    residentPasswordReset(dto: ResidentPasswordResetDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
}
