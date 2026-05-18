"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    configService;
    supabase;
    supabaseAdmin;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.supabase = (0, supabase_js_1.createClient)(this.configService.get('SUPABASE_URL'), this.configService.get('SUPABASE_ANON_KEY'));
        this.supabaseAdmin = (0, supabase_js_1.createClient)(this.configService.get('SUPABASE_URL'), this.configService.get('SUPABASE_SERVICE_ROLE_KEY'));
    }
    async signUp(dto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing)
            throw new common_1.ConflictException('An account with this email already exists. Please sign in instead.');
        const { data, error } = await this.supabase.auth.signUp({
            email: dto.email,
            password: dto.password,
            options: { data: { name: dto.name } },
        });
        if (error) {
            if (error.message?.toLowerCase().includes('already registered') || error.message?.toLowerCase().includes('already been registered')) {
                throw new common_1.ConflictException('An account with this email already exists. Please sign in instead.');
            }
            throw new common_1.UnauthorizedException(error.message);
        }
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
                phone: dto.phone,
                authId: data.user.id,
                role: 'USER',
            },
        });
        return {
            user,
            session: data.session,
        };
    }
    async signIn(dto) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email: dto.email,
            password: dto.password,
        });
        if (error) {
            if (error.message?.toLowerCase().includes('invalid login credentials')) {
                const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
                if (!existingUser) {
                    throw new common_1.UnauthorizedException('No account found with this email. Please sign up first.');
                }
                throw new common_1.UnauthorizedException('Incorrect password. Please try again or reset your password.');
            }
            throw new common_1.UnauthorizedException(error.message);
        }
        let user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    name: data.user.user_metadata?.name || dto.email.split('@')[0],
                    authId: data.user.id,
                    role: 'USER',
                },
            });
        }
        return {
            user,
            session: data.session,
        };
    }
    async adminSignIn(dto) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email: dto.email,
            password: dto.password,
        });
        if (error)
            throw new common_1.UnauthorizedException('Invalid credentials');
        let user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    name: data.user?.user_metadata?.name || 'Admin',
                    authId: data.user.id,
                    role: 'ADMIN',
                },
            });
        }
        else if (user.role !== 'ADMIN') {
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: { role: 'ADMIN', authId: data.user.id },
            });
        }
        return {
            user,
            session: data.session,
        };
    }
    async refreshSession(refreshToken) {
        const { data, error } = await this.supabase.auth.refreshSession({ refresh_token: refreshToken });
        if (error || !data.session) {
            throw new common_1.UnauthorizedException('Session expired. Please sign in again.');
        }
        let user = await this.prisma.user.findUnique({ where: { authId: data.user.id } });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email: data.user.email,
                    name: data.user.user_metadata?.name || data.user.email.split('@')[0],
                    authId: data.user.id,
                    role: 'USER',
                },
            });
        }
        return {
            user,
            session: data.session,
        };
    }
    async getProfile(authId) {
        return this.prisma.user.findUnique({
            where: { authId },
            include: { addresses: true },
        });
    }
    async syncOAuth(accessToken, requireAdmin = false) {
        const { data: { user }, error } = await this.supabase.auth.getUser(accessToken);
        if (error || !user)
            throw new common_1.UnauthorizedException('Invalid OAuth session');
        let dbUser = await this.prisma.user.findUnique({ where: { authId: user.id } });
        if (!dbUser) {
            dbUser = await this.prisma.user.create({
                data: {
                    email: user.email,
                    name: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0],
                    avatar: user.user_metadata?.avatar_url,
                    authId: user.id,
                    role: 'USER',
                },
            });
        }
        if (requireAdmin && dbUser.role !== 'ADMIN') {
            throw new common_1.UnauthorizedException('Admin access denied');
        }
        return {
            user: dbUser,
            session: { access_token: accessToken },
        };
    }
    async forgotPassword(email, redirectTo) {
        const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
        });
        if (error) {
            throw new common_1.UnauthorizedException(error.message);
        }
        return { message: 'Password reset link sent successfully' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map