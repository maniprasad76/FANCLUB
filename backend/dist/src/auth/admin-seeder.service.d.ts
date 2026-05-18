import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class AdminSeederService implements OnModuleInit {
    private readonly prisma;
    private readonly config;
    private readonly logger;
    private supabaseAdmin;
    constructor(prisma: PrismaService, config: ConfigService);
    onModuleInit(): Promise<void>;
    private ensureAdminExists;
}
