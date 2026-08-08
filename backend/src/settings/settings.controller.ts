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
  BadRequestException,
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

  /**
   * Courier tracking URL template shown on the order tracking page.
   * Public — the storefront needs it to build the "Track Package" link.
   * The value must contain a {trackingId} placeholder that gets replaced
   * with the order's courier tracking ID, e.g.
   *   https://www.delhivery.com/track?awb={trackingId}
   */
  @SkipThrottle()
  @Get('tracking-url')
  async getTrackingUrl() {
    const all = await this.settingsService.getSettings();
    // `configured` tells the storefront whether the admin has explicitly set
    // this setting — an explicit (even empty) value must win over the
    // build-time env fallback so admins can fully disable the link.
    const configured = Object.prototype.hasOwnProperty.call(
      all,
      'courier_tracking_url',
    );
    return { url: all['courier_tracking_url'] || '', configured };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(CacheInvalidationInterceptor)
  @Audit('UPDATE_COURIER_TRACKING_URL', 'SETTING')
  @Post('tracking-url')
  async setTrackingUrl(@Body('url') url: unknown) {
    const value = typeof url === 'string' ? url.trim() : '';

    if (value.length > 500) {
      throw new BadRequestException(
        'Tracking URL template must be 500 characters or fewer',
      );
    }
    // SECURITY: only http(s) templates — blocks javascript:/data: schemes
    // that would execute in a customer's browser when they click the link.
    if (value && !/^https?:\/\//i.test(value)) {
      throw new BadRequestException(
        'Tracking URL template must start with http:// or https://',
      );
    }
    if (value && !value.includes('{trackingId}')) {
      throw new BadRequestException(
        'Tracking URL template must contain the {trackingId} placeholder',
      );
    }

    // Empty string clears the setting
    await this.settingsService.setSetting('courier_tracking_url', value);
    return { success: true, url: value };
  }
}
