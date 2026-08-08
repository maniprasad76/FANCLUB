import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger(UploadService.name);
  private supabase: SupabaseClient;

  // All buckets must be public so that storefront <img> tags can load the
  // uploaded files without signed URLs.
  private static readonly PUBLIC_BUCKETS = [
    'products',
    'avatars',
    'settings',
    'reviews',
  ];

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  /** Ensure all storage buckets exist (created as public, idempotent). */
  async onModuleInit() {
    for (const bucket of UploadService.PUBLIC_BUCKETS) {
      try {
        const { data: existing } = await this.supabase.storage.getBucket(bucket);
        if (!existing) {
          const { error } = await this.supabase.storage.createBucket(bucket, {
            public: true,
            fileSizeLimit: 10 * 1024 * 1024, // 10MB
          });
          if (error && !String(error.message).toLowerCase().includes('already exists')) {
            this.logger.warn(
              `Could not create storage bucket "${bucket}": ${error.message}`,
            );
          } else {
            this.logger.log(`Storage bucket "${bucket}" ready (public).`);
          }
        }
      } catch (err) {
        this.logger.warn(
          `Could not verify storage bucket "${bucket}": ${(err as Error).message}`,
        );
      }
    }
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

  /**
   * Upload an in-memory file buffer to Supabase Storage and return the
   * permanent public URL.
   *
   * This is the production-safe replacement for disk-based uploads: files on
   * ephemeral filesystems (Render, Cloud Run, serverless) are lost on every
   * redeploy and are not shared between instances, whereas Supabase Storage
   * survives deploys and is immediately visible to the storefront.
   */
  async uploadFile(
    file: Express.Multer.File,
    bucket: string,
  ): Promise<{ path: string; publicUrl: string }> {
    // Ensure the bucket exists (idempotent — safe on every call).
    const { data: existing } = await this.supabase.storage.getBucket(bucket);
    if (!existing) {
      await this.supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024,
      });
    }

    const originalExt = (file.originalname || '').split('.').pop() || 'jpg';
    const safeExt = originalExt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const ext = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(safeExt)
      ? safeExt
      : 'jpg';
    const path = `uploads/${new Date().toISOString().slice(0, 10)}/${uuidv4()}.${ext}`;

    const { error } = await this.supabase.storage.from(bucket).upload(
      path,
      file.buffer,
      {
        contentType: file.mimetype || 'image/jpeg',
        upsert: false,
        cacheControl: '3600',
      },
    );

    if (error) throw error;

    const publicUrl = `${this.configService.get('SUPABASE_URL')}/storage/v1/object/public/${bucket}/${path}`;
    return { path, publicUrl };
  }

  /** Delete a file by its full public URL (parses bucket + path). */
  async deleteByPublicUrl(publicUrl: string): Promise<void> {
    if (!publicUrl || !publicUrl.startsWith('http')) return;
    const url = new URL(publicUrl);
    const parts = url.pathname.split('/');
    // /storage/v1/object/public/{bucket}/{...path}
    const bucketIdx = parts.indexOf('public');
    if (bucketIdx === -1 || parts.length <= bucketIdx + 2) return;
    const bucket = parts[bucketIdx + 1];
    const path = parts.slice(bucketIdx + 2).join('/');
    if (!bucket || !path) return;
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([decodeURIComponent(path)]);
    if (error) throw error;
  }

  async deleteFile(bucket: string, path: string) {
    const { error } = await this.supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
    return { message: 'File deleted' };
  }
}
