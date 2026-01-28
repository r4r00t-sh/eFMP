import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: {
        username: string;
        password: string;
    }): Promise<{
        access_token: string;
        user: {
            id: any;
            username: any;
            email: any;
            name: any;
            role: any;
            departmentId: any;
            divisionId: any;
        };
    }>;
    register(registerDto: {
        username: string;
        password: string;
        name: string;
        email?: string;
        role?: string;
        departmentId?: string;
        divisionId?: string;
    }): Promise<any>;
    logout(req: any): Promise<{
        success: boolean;
    }>;
    getProfile(req: any): any;
}
