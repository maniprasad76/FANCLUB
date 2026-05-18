import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async getSignedUploadUrl(bucket: string, filename: string) {
    const ext = filename.split('.').pop();
    const path = `${uuidv4()}.${ext}`;

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error) throw error;

    const publicUrl = `${this.configService.get('SUPABASE_URL')}/storage/v1/object/public/${bucket}/${path}`;

    return { signedUrl: data.signedUrl, path, publicUrl, token: data.token };
  }

  async deleteFile(bucket: string, path: string) {
    const { error } = await this.supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
    return { message: 'File deleted' };
  }
}
