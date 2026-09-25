import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        success: boolean;
        message: string;
        data: import("../services/auth.service").AuthSession;
    }>;
}
