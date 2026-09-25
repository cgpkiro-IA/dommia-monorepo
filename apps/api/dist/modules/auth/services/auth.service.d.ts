import { AuthRepository } from '../repositories/auth.repository';
import { LoginDto } from '../dto/login.dto';
export interface TenantInfo {
    id: string;
    slug: string;
    name: string;
    tier: string;
    maxProperties: number;
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
export declare class AuthService {
    private readonly authRepo;
    private readonly logger;
    constructor(authRepo: AuthRepository);
    login(dto: LoginDto): Promise<AuthSession>;
}
