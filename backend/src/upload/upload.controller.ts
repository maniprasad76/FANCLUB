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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('upload')
export class UploadController {
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

  @Post('image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './public/uploads';
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, 'image-' + uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
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
        cb(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('No file uploaded');

    const imageUrl = `/public/uploads/${file.filename}`;
    return { success: true, url: imageUrl };
  }
}
