import {
  Controller,
  Get,
  Post,
  Delete,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import * as fs from 'fs';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { SkipThrottle } from '@nestjs/throttler';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Audit } from '../audit/decorators/audit.decorator.js';

@SkipThrottle()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600000) // 10 minutes
  @Get('about-image')
  async getAboutImage() {
    return { url: await this.settingsService.getSetting('about_image_url') };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Audit('UPLOAD_ABOUT_IMAGE', 'SETTING')
  @Post('about-image/upload')
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
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, 'about-image-' + uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadAboutImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('No file uploaded');

    const imageUrl = `/public/uploads/${file.filename}`;
    await this.settingsService.setSetting('about_image_url', imageUrl);
    return { success: true, url: imageUrl };
  }

  /** Safe file deletion — prevents path traversal attacks */
  private safeDeleteFile(filePath: string): void {
    const uploadsDir = resolve(process.cwd(), 'public', 'uploads');
    const resolved = resolve(process.cwd(), filePath.replace(/^\.?\//, ''));
    if (!resolved.startsWith(uploadsDir)) {
      // Path traversal attempt — refuse to delete
      return;
    }
    try {
      if (fs.existsSync(resolved)) fs.unlinkSync(resolved);
    } catch (e) {
      // File already deleted or inaccessible — safe to ignore
    }
  }


  @UseGuards(JwtAuthGuard, AdminGuard)
  @Audit('DELETE_ABOUT_IMAGE', 'SETTING')
  @Delete('about-image')
  async deleteAboutImage() {
    const currentUrl = await this.settingsService.getSetting('about_image_url');
    if (currentUrl) {
      this.safeDeleteFile(`.${currentUrl}`);
      await this.settingsService.deleteSetting('about_image_url');
    }
    return { success: true };
  }

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600000) // 10 minutes
  @Get('hero-images')
  async getHeroImages() {
    return {
      urls: (await this.settingsService.getSetting('hero_images_urls')) || [],
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Audit('UPLOAD_HERO_IMAGE', 'SETTING')
  @Post('hero-images/upload')
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
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, 'hero-image-' + uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadHeroImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('No file uploaded');

    const imageUrl = `/public/uploads/${file.filename}`;
    const currentUrls =
      (await this.settingsService.getSetting('hero_images_urls')) || [];
    await this.settingsService.setSetting('hero_images_urls', [
      ...currentUrls,
      imageUrl,
    ]);
    return {
      success: true,
      url: imageUrl,
      urls: await this.settingsService.getSetting('hero_images_urls'),
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Audit('DELETE_HERO_IMAGE', 'SETTING')
  @Delete('hero-images')
  async deleteHeroImage(@Body('url') urlToDelete: string) {
    let currentUrls =
      (await this.settingsService.getSetting('hero_images_urls')) || [];
    if (currentUrls.includes(urlToDelete)) {
      this.safeDeleteFile(`.${urlToDelete}`);
      currentUrls = currentUrls.filter((u: string) => u !== urlToDelete);
      await this.settingsService.setSetting('hero_images_urls', currentUrls);
    }
    return { success: true, urls: currentUrls };
  }

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600000) // 10 minutes
  @Get('cod')
  async getCodStatus() {
    const status = await this.settingsService.getSetting('cod_enabled');
    // Default to true if not explicitly set to false
    return { enabled: status !== false };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Audit('TOGGLE_COD_STATUS', 'SETTING')
  @Post('cod')
  async toggleCod(@Body('enabled') enabled: boolean) {
    await this.settingsService.setSetting('cod_enabled', enabled);
    return { success: true, enabled };
  }
}
