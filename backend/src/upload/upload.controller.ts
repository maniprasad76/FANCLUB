import {
  Controller,
  Post,
  Delete,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { extname, basename } from 'path';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

/**
 * Shared validation for image uploads (MIME + extension + size limits).
 * Files are held in memory and pushed straight to Supabase Storage.
 */
function imageFileInterceptor() {
  return FileInterceptor('image', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
      // SECURITY: Validate MIME type
      const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
      ];
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(
          new BadRequestException(
            'Only image files (JPEG, PNG, WebP, GIF) are allowed',
          ),
          false,
        );
      }

      // SECURITY: Validate extension matches MIME type
      const ext = extname(file.originalname).toLowerCase();
      const mimeExtMap: Record<string, string[]> = {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/webp': ['.webp'],
        'image/gif': ['.gif'],
      };
      const validExts = mimeExtMap[file.mimetype] || [];
      if (!validExts.includes(ext)) {
        return cb(
          new BadRequestException(
            `File extension ${ext} does not match content type ${file.mimetype}`,
          ),
          false,
        );
      }

      cb(null, true);
    },
  });
}

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private uploadService: UploadService) {}

  private static readonly ALLOWED_BUCKETS = [
    'products',
    'avatars',
    'settings',
    'reviews',
  ];

  @Post('signed-url')
  getSignedUploadUrl(
    @Body('bucket') bucket: string,
    @Body('filename') filename: string,
  ) {
    const safeBucket = bucket || 'products';
    if (!UploadController.ALLOWED_BUCKETS.includes(safeBucket)) {
      throw new BadRequestException(
        `Invalid bucket. Allowed: ${UploadController.ALLOWED_BUCKETS.join(', ')}`,
      );
    }
    return this.uploadService.getSignedUploadUrl(safeBucket, filename);
  }

  @Delete()
  deleteFile(@Query('bucket') bucket: string, @Query('path') path: string) {
    if (!UploadController.ALLOWED_BUCKETS.includes(bucket)) {
      throw new BadRequestException(
        `Invalid bucket. Allowed: ${UploadController.ALLOWED_BUCKETS.join(', ')}`,
      );
    }
    return this.uploadService.deleteFile(bucket, path);
  }

  /**
   * Product / avatar image upload.
   *
   * Files are uploaded to Supabase Storage (durable, survives redeploys) and
   * the returned `url` is a permanent public URL. This endpoint previously
   * wrote to `./public/uploads` on the local disk, which is ephemeral on
   * Render/Cloud Run and lost on every deploy.
   */
  @Post('image')
  @UseInterceptors(imageFileInterceptor())
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const safeBase = basename(file.originalname)
      .replace(/\.[.\\/]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const parts = safeBase.split('.');
    if (parts.length > 2) {
      throw new BadRequestException(
        'Invalid filename: double extensions are not allowed',
      );
    }

    const { publicUrl } = await this.uploadService.uploadFile(
      file,
      'products',
    );

    this.logger.log(`Product image uploaded to Supabase Storage: ${publicUrl}`);
    return { success: true, url: publicUrl };
  }
}

/**
 * Customer-facing upload endpoint for review photos.
 *
 * Deliberately a separate controller class: the class above is admin-guarded,
 * and NestJS merges class + method guards (both must pass), so a shared class
 * would have made customer uploads impossible. Only JWT auth is required —
 * signed-in customers may upload review photos, rate-limited to prevent abuse.
 */
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UserUploadController {
  private readonly logger = new Logger(UserUploadController.name);

  constructor(private uploadService: UploadService) {}

  /** 10 uploads per minute per user — abuse protection. */
  @Throttle({ strict: { limit: 10, ttl: 60000 } })
  @Post('review-image')
  @UseInterceptors(imageFileInterceptor())
  async uploadReviewImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const safeBase = basename(file.originalname)
      .replace(/\.[.\\/]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const parts = safeBase.split('.');
    if (parts.length > 2) {
      throw new BadRequestException(
        'Invalid filename: double extensions are not allowed',
      );
    }

    const { publicUrl } = await this.uploadService.uploadFile(file, 'reviews');

    this.logger.log(`Review photo uploaded to Supabase Storage: ${publicUrl}`);
    return { success: true, url: publicUrl };
  }
}
