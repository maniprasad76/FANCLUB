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
var AdminSeederService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSeederService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
const prisma_service_1 = require("../prisma/prisma.service");
let AdminSeederService = AdminSeederService_1 = class AdminSeederService {
    prisma;
    config;
    logger = new common_1.Logger(AdminSeederService_1.name);
    supabaseAdmin;
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.supabaseAdmin = (0, supabase_js_1.createClient)(this.config.get('SUPABASE_URL'), this.config.get('SUPABASE_SERVICE_ROLE_KEY'));
    }
    async onModuleInit() {
        const email = this.config.get('ADMIN_EMAIL');
        const password = this.config.get('ADMIN_PASSWORD');
        if (!email || !password) {
            this.logger.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin seed');
            return;
        }
        try {
            await this.ensureAdminExists(email, password);
        }
        catch (err) {
            this.logger.error(`Admin seed failed: ${err.message}`);
        }
    }
    async ensureAdminExists(email, password) {
        const { data: existingUsers, error: listError } = await this.supabaseAdmin.auth.admin.listUsers();
        if (listError) {
            this.logger.error(`Could not list Supabase users: ${listError.message}`);
            return;
        }
        let supabaseUser = existingUsers.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (supabaseUser) {
            const { data: updated, error: updateErr } = await this.supabaseAdmin.auth.admin.updateUserById(supabaseUser.id, {
                password,
                email_confirm: true,
            });
            if (updateErr) {
                this.logger.error(`Failed to update admin password: ${updateErr.message}`);
            }
            else {
                supabaseUser = updated.user;
                this.logger.log(`Admin password updated for ${email}`);
            }
        }
        else {
            const { data: created, error: createErr } = await this.supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name: 'Admin' },
            });
            if (createErr) {
                this.logger.error(`Failed to create admin in Supabase: ${createErr.message}`);
                return;
            }
            supabaseUser = created.user;
            this.logger.log(`Admin user created in Supabase Auth: ${email}`);
        }
        if (!supabaseUser)
            return;
        let dbUser = await this.prisma.user.findUnique({ where: { email } });
        if (!dbUser) {
            dbUser = await this.prisma.user.create({
                data: {
                    email,
                    name: 'Admin',
                    authId: supabaseUser.id,
                    role: 'ADMIN',
                },
            });
            this.logger.log(`Admin user created in local DB: ${email}`);
        }
        else if (dbUser.role !== 'ADMIN' || dbUser.authId !== supabaseUser.id) {
            dbUser = await this.prisma.user.update({
                where: { id: dbUser.id },
                data: { role: 'ADMIN', authId: supabaseUser.id },
            });
            this.logger.log(`Existing user promoted to ADMIN: ${email}`);
        }
        else {
            this.logger.log(`Admin account already configured: ${email}`);
        }
    }
};
exports.AdminSeederService = AdminSeederService;
exports.AdminSeederService = AdminSeederService = AdminSeederService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], AdminSeederService);
//# sourceMappingURL=admin-seeder.service.js.map