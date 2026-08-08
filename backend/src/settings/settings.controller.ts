import {
  Controller,
  Get,
  Post,
  Delete,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Body,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { SkipThrottle } from '@nestjs/throttler';
import { SettingsService } from './settings.service';
import { UploadService } from '../upload/upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CacheInvalidationInterceptor } from '../common/interceptors/cache-invalidation.interceptor';
import { Audit } from '../audit/decorators/audit.decorator.js';

@SkipThrottle()
@Controller('settings')
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly uploadService: UploadService,
  ) {}

  /** Best-effort storage cleanup — a failure must never block the DB update. */
  private async cleanupFile(url: string | undefined | null) {
    if (!url) return;
    try {
      await this.uploadService.deleteByPublicUrl(url);
    } catch (err) {
      this.logger.warn(
        `Failed to remove file from storage (will retry manually): ${(err as Error).message}`,
      );
    }
  }

  @Get('about-image')
  async getAboutImage() {
    return { url: await this.settingsService.getSetting('about_image_url') };
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(CacheInvalidationInterceptor)
  @Audit('UPLOAD_ABOUT_IMAGE', 'SETTING')
  @Post('about-image/upload')
  @UseInterceptors(
    FileInterceptor('image', {
      // In-memory storage: files are streamed to durable Supabase Storage
      // instead of an ephemeral local disk (lost on redeploy on Render etc.).
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadAboutImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('No file uploaded');

    const { publicUrl } = await this.uploadService.uploadFile(file, 'settings');
    await this.settingsService.setSetting('about_image_url', publicUrl);
    return { success: true, url: publicUrl };
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(CacheInvalidationInterceptor)
  @Audit('DELETE_ABOUT_IMAGE', 'SETTING')
  @Delete('about-image')
  async deleteAboutImage() {
    const currentUrl = await this.settingsService.getSetting('about_image_url');
    if (currentUrl) {
      await this.cleanupFile(currentUrl);
      await this.settingsService.deleteSetting('about_image_url');
    }
    return { success: true };
  }

  @SkipThrottle()
  @Get('hero-images')
  async getHeroImages() {
    return {
      urls: (await this.settingsService.getSetting('hero_images_urls')) || [],
    };
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(CacheInvalidationInterceptor)
  @Audit('UPLOAD_HERO_IMAGE', 'SETTING')
  @Post('hero-images/upload')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadHeroImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('No file uploaded');

    const { publicUrl } = await this.uploadService.uploadFile(file, 'settings');
    const currentUrls =
      (await this.settingsService.getSetting('hero_images_urls')) || [];
    const nextUrls = [...currentUrls, publicUrl];
    await this.settingsService.setSetting('hero_images_urls', nextUrls);
    return { success: true, url: publicUrl, urls: nextUrls };
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(CacheInvalidationInterceptor)
  @Audit('DELETE_HERO_IMAGE', 'SETTING')
  @Delete('hero-images')
  async deleteHeroImage(@Body('url') urlToDelete: string) {
    let currentUrls =
      (await this.settingsService.getSetting('hero_images_urls')) || [];
    if (currentUrls.includes(urlToDelete)) {
      await this.cleanupFile(urlToDelete);
      currentUrls = currentUrls.filter((u: string) => u !== urlToDelete);
      await this.settingsService.setSetting('hero_images_urls', currentUrls);
    }
    return { success: true, urls: currentUrls };
  }

  @Get('cod')
  async getCodStatus() {
    const status = await this.settingsService.getSetting('cod_enabled');
    // Default to true if not explicitly set to false
    return { enabled: status !== false };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(CacheInvalidationInterceptor)
  @Audit('TOGGLE_COD_STATUS', 'SETTING')
  @Post('cod')
  async toggleCod(@Body('enabled') enabled: boolean) {
    await this.settingsService.setSetting('cod_enabled', enabled);
    return { success: true, enabled };
  }
}
