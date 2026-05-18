import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SignUpDto, SignInDto } from './dto/auth.dto';
export declare class AuthService {
    private prisma;
    private configService;
    private supabase;
    private supabaseAdmin;
    constructor(prisma: PrismaService, configService: ConfigService);
    signUp(dto: SignUpDto): Promise<{
        user: {
            email: string;
            name: string | null;
            phone: string | null;
            id: string;
            authId: string;
            avatar: string | null;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        };
        session: import("@supabase/supabase-js").AuthSession | null;
    }>;
    signIn(dto: SignInDto): Promise<{
        user: {
            email: string;
            name: string | null;
            phone: string | null;
            id: string;
            authId: string;
            avatar: string | null;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        };
        session: import("@supabase/supabase-js").AuthSession;
    }>;
    adminSignIn(dto: SignInDto): Promise<{
        user: {
            email: string;
            name: string | null;
            phone: string | null;
            id: string;
            authId: string;
            avatar: string | null;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        };
        session: import("@supabase/supabase-js").AuthSession;
    }>;
    refreshSession(refreshToken: string): Promise<{
        user: {
            email: string;
            name: string | null;
            phone: string | null;
            id: string;
            authId: string;
            avatar: string | null;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        };
        session: import("@supabase/supabase-js").AuthSession;
    }>;
    getProfile(authId: string): Promise<({
        addresses: {
            name: string;
            phone: string;
            id: string;
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
        email: string;
        name: string | null;
        phone: string | null;
        id: string;
        authId: string;
        avatar: string | null;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    syncOAuth(accessToken: string, requireAdmin?: boolean): Promise<{
        user: {
            email: string;
            name: string | null;
            phone: string | null;
            id: string;
            authId: string;
            avatar: string | null;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        };
        session: {
            access_token: string;
        };
    }>;
    forgotPassword(email: string, redirectTo: string): Promise<{
        message: string;
    }>;
}
