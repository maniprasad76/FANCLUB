import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';

/**
 * AdminSeederService
 * ------------------
 * Runs once on application startup to guarantee that the configured
 * admin account (from ADMIN_EMAIL / ADMIN_PASSWORD env vars) exists
 * in both Supabase Auth and the local Prisma database.
 *
 * Credentials live exclusively in the backend .env — they are
 * NEVER sent to the frontend or admin panel.
 */
@Injectable()
export class AdminSeederService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeederService.name);
  private supabaseAdmin: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.supabaseAdmin = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async onModuleInit() {
    const email = this.config.get<string>('ADMIN_EMAIL');
    const password = this.config.get<string>('ADMIN_PASSWORD');

    if (!email || !password) {
      this.logger.warn(
        'ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin seed',
      );
      return;
    }

    try {
      await this.ensureAdminExists(email, password);
    } catch (err) {
      this.logger.error(`Admin seed failed: ${(err as Error).message}`);
    }
  }

  private async ensureAdminExists(email: string, password: string) {
    // ── Step 1: Check if user already exists in Supabase Auth ──
    const { data: existingUsers, error: listError } =
      await this.supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      this.logger.error(`Could not list Supabase users: ${listError.message}`);
      return;
    }

    let supabaseUser = existingUsers.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (supabaseUser) {
      // User exists — update password to match env in case it changed
      const { data: updated, error: updateErr } =
        await this.supabaseAdmin.auth.admin.updateUserById(supabaseUser.id, {
          password,
          email_confirm: true,
        });

      if (updateErr) {
        this.logger.error(
          `Failed to update admin password: ${updateErr.message}`,
        );
      } else {
        supabaseUser = updated.user;
        this.logger.log(`Admin password updated for ${email}`);
      }
    } else {
      // User doesn't exist — create in Supabase Auth
      const { data: created, error: createErr } =
        await this.supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Skip email verification for admin
          user_metadata: { name: 'Admin' },
        });

      if (createErr) {
        this.logger.error(
          `Failed to create admin in Supabase: ${createErr.message}`,
        );
        return;
      }

      supabaseUser = created.user;
      this.logger.log(`Admin user created in Supabase Auth: ${email}`);
    }

    // ── Step 2: Ensure admin record exists in local DB ──
    if (!supabaseUser) return;

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
    } else if (dbUser.role !== 'ADMIN' || dbUser.authId !== supabaseUser.id) {
      dbUser = await this.prisma.user.update({
        where: { id: dbUser.id },
        data: { role: 'ADMIN', authId: supabaseUser.id },
      });
      this.logger.log(`Existing user promoted to ADMIN: ${email}`);
    } else {
      this.logger.log(`Admin account already configured: ${email}`);
    }
  }
}
