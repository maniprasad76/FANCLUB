import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!url || !serviceRoleKey) {
      throw new Error(
        'Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY',
      );
    }

    this.client = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  onModuleInit(): void {
    this.logger.log('Supabase service-role client initialised');
  }

  /**
   * Returns the singleton Supabase client configured with the service role key.
   * Service role bypasses RLS — use only in backend services.
   */
  getClient(): SupabaseClient {
    return this.client;
  }
}
