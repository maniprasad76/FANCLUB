import { AuthService } from './auth.service';
import { SignUpDto, SignInDto, ForgotPasswordDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    signUp(dto: SignUpDto, res: any): Promise<{
        user: {
            id: string;
            email: string;
            name: string | null;
            phone: string | null;
            avatar: string | null;
            role: import("@prisma/client").$Enums.Role;
            authId: string;
            createdAt: Date;
            updatedAt: Date;
        };
        session: {
            access_token: string | undefined;
            refresh_token: string | undefined;
        };
    }>;
    signIn(dto: SignInDto, res: any): Promise<{
        user: {
            id: string;
            email: string;
            name: string | null;
            phone: string | null;
            avatar: string | null;
            role: import("@prisma/client").$Enums.Role;
            authId: string;
            createdAt: Date;
            updatedAt: Date;
        };
        session: {
            access_token: string;
            refresh_token: string;
        };
    }>;
    adminSignIn(dto: SignInDto, res: any): Promise<{
        user: {
            id: string;
            email: string;
            name: string | null;
            phone: string | null;
            avatar: string | null;
            role: import("@prisma/client").$Enums.Role;
            authId: string;
            createdAt: Date;
            updatedAt: Date;
        };
        session: {
            access_token: string;
            refresh_token: string;
        };
    }>;
    refreshSession(refreshToken: string, res: any): Promise<{
        user: {
            id: string;
            email: string;
            name: string | null;
            phone: string | null;
            avatar: string | null;
            role: import("@prisma/client").$Enums.Role;
            authId: string;
            createdAt: Date;
            updatedAt: Date;
        };
        session: {
            access_token: string;
            refresh_token: string;
        };
    }>;
    syncUserOAuth(accessToken: string, res: any): Promise<{
        user: {
            id: string;
            email: string;
            name: string | null;
            phone: string | null;
            avatar: string | null;
            role: import("@prisma/client").$Enums.Role;
            authId: string;
            createdAt: Date;
            updatedAt: Date;
        };
        session: {
            access_token: string;
        };
    }>;
    syncAdminOAuth(accessToken: string, res: any): Promise<{
        user: {
            id: string;
            email: string;
            name: string | null;
            phone: string | null;
            avatar: string | null;
            role: import("@prisma/client").$Enums.Role;
            authId: string;
            createdAt: Date;
            updatedAt: Date;
        };
        session: {
            access_token: string;
        };
    }>;
    logout(res: any): Promise<{
        message: string;
    }>;
    getProfile(authId: string): Promise<({
        addresses: {
            id: string;
            name: string;
            phone: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            street: string;
            city: string;
            state: string;
            pincode: string;
            country: string;
            isDefault: boolean;
        }[];
    } & {
        id: string;
        email: string;
        name: string | null;
        phone: string | null;
        avatar: string | null;
        role: import("@prisma/client").$Enums.Role;
        authId: string;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    forgotPassword(dto: ForgotPasswordDto, redirectTo: string): Promise<{
        message: string;
    }>;
}
