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
import { diskStorage } from 'multer';
import { extname, basename } from 'path';
import * as fs from 'fs';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private uploadService: UploadService) {}

  private static readonly ALLOWED_BUCKETS = ['products', 'avatars'];

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
   * @deprecated Use POST /upload/signed-url instead.
   * Disk-based uploads are ephemeral on Cloud Run and will be lost on redeploy.
   * This endpoint is kept for backward compatibility only.
   */
  @Post('image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadPath = './public/uploads';
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (_req, file, cb) => {
          // SECURITY: Sanitize filename to prevent path traversal
          const safeBase = basename(file.originalname)
            .replace(/\.\.[\\/]/g, '') // Strip path traversal sequences
            .replace(/[^a-zA-Z0-9._-]/g, '_'); // Allow only safe characters

          // SECURITY: Reject double extensions (e.g., file.php.jpg)
          const parts = safeBase.split('.');
          if (parts.length > 2) {
            return cb(
              new BadRequestException(
                'Invalid filename: double extensions are not allowed',
              ),
              '',
            );
          }

          const ext = extname(safeBase).toLowerCase();
          const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
          if (!allowedExts.includes(ext)) {
            return cb(
              new BadRequestException(`Invalid file extension: ${ext}`),
              '',
            );
          }

          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, 'image-' + uniqueSuffix + ext);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB (reduced from 10MB)
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
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    this.logger.warn(
      `⚠️ Deprecated disk upload used. Migrate to POST /upload/signed-url for Supabase Storage.`,
    );

    const imageUrl = `/public/uploads/${file.filename}`;
    return { success: true, url: imageUrl };
  }
}
