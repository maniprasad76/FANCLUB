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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("./auth.service");
const auth_dto_1 = require("./dto/auth.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const current_user_decorator_1 = require("./decorators/current-user.decorator");
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
};
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async signUp(dto, res) {
        const result = await this.authService.signUp(dto);
        if (result.session?.access_token) {
            res.cookie('access_token', result.session.access_token, COOKIE_OPTIONS);
        }
        return {
            user: result.user,
            session: {
                access_token: result.session?.access_token,
                refresh_token: result.session?.refresh_token,
            },
        };
    }
    async signIn(dto, res) {
        const result = await this.authService.signIn(dto);
        if (result.session?.access_token) {
            res.cookie('access_token', result.session.access_token, COOKIE_OPTIONS);
        }
        return {
            user: result.user,
            session: {
                access_token: result.session?.access_token,
                refresh_token: result.session?.refresh_token,
            },
        };
    }
    async adminSignIn(dto, res) {
        const result = await this.authService.adminSignIn(dto);
        if (result.session?.access_token) {
            res.cookie('access_token', result.session.access_token, COOKIE_OPTIONS);
        }
        return {
            user: result.user,
            session: {
                access_token: result.session?.access_token,
                refresh_token: result.session?.refresh_token,
            },
        };
    }
    async refreshSession(refreshToken, res) {
        const result = await this.authService.refreshSession(refreshToken);
        if (result.session?.access_token) {
            res.cookie('access_token', result.session.access_token, COOKIE_OPTIONS);
        }
        return {
            user: result.user,
            session: {
                access_token: result.session?.access_token,
                refresh_token: result.session?.refresh_token,
            },
        };
    }
    async syncUserOAuth(accessToken, res) {
        const result = await this.authService.syncOAuth(accessToken, false);
        if (result.session?.access_token) {
            res.cookie('access_token', result.session.access_token, COOKIE_OPTIONS);
        }
        return { user: result.user, session: result.session };
    }
    async syncAdminOAuth(accessToken, res) {
        const result = await this.authService.syncOAuth(accessToken, true);
        if (result.session?.access_token) {
            res.cookie('access_token', result.session.access_token, COOKIE_OPTIONS);
        }
        return { user: result.user, session: result.session };
    }
    async logout(res) {
        res.clearCookie('access_token', { path: '/', sameSite: 'none', secure: true });
        return { message: 'Logged out successfully' };
    }
    getProfile(authId) {
        return this.authService.getProfile(authId);
    }
    async forgotPassword(dto, redirectTo) {
        return this.authService.forgotPassword(dto.email, redirectTo);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, throttler_1.Throttle)({ default: { ttl: 60000, limit: 5 } }),
    (0, common_1.Post)('signup'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.SignUpDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signUp", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { ttl: 60000, limit: 5 } }),
    (0, common_1.Post)('signin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.SignInDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signIn", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { ttl: 60000, limit: 5 } }),
    (0, common_1.Post)('admin/signin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.SignInDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "adminSignIn", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Body)('refresh_token')),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshSession", null);
__decorate([
    (0, common_1.Post)('user/oauth/sync'),
    __param(0, (0, common_1.Body)('access_token')),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "syncUserOAuth", null);
__decorate([
    (0, common_1.Post)('admin/oauth/sync'),
    __param(0, (0, common_1.Body)('access_token')),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "syncAdminOAuth", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('authId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { ttl: 60000, limit: 3 } }),
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Body)('redirectTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ForgotPasswordDto, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map