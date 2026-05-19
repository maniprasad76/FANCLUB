import { Controller, Get, Post, Delete, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('video')
  getFooterVideo() {
    return { url: this.settingsService.getSetting('footer_video_url') };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('video/upload')
  @UseInterceptors(FileInterceptor('video', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = './public/uploads';
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'footer-video-' + uniqueSuffix + extname(file.originalname));
      }
    }),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
  }))
  uploadFooterVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error("No file uploaded");
    
    const videoUrl = `/public/uploads/${file.filename}`;
    this.settingsService.setSetting('footer_video_url', videoUrl);
    return { success: true, url: videoUrl };
  }

  @Get('about-image')
  getAboutImage() {
    return { url: this.settingsService.getSetting('about_image_url') };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('about-image/upload')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = './public/uploads';
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'about-image-' + uniqueSuffix + extname(file.originalname));
      }
    }),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
  }))
  uploadAboutImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error("No file uploaded");
    
    const imageUrl = `/public/uploads/${file.filename}`;
    this.settingsService.setSetting('about_image_url', imageUrl);
    return { success: true, url: imageUrl };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('video')
  deleteFooterVideo() {
    const currentUrl = this.settingsService.getSetting('footer_video_url');
    if (currentUrl) {
      const filePath = `.${currentUrl}`;
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {
        console.error('Could not delete video file', e);
      }
      this.settingsService.deleteSetting('footer_video_url');
    }
    return { success: true };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('about-image')
  deleteAboutImage() {
    const currentUrl = this.settingsService.getSetting('about_image_url');
    if (currentUrl) {
      const filePath = `.${currentUrl}`;
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {
        console.error('Could not delete image file', e);
      }
      this.settingsService.deleteSetting('about_image_url');
    }
    return { success: true };
  }
}
