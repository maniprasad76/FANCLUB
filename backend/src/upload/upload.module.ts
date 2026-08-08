import { Module } from '@nestjs/common';
import {
  UploadController,
  UserUploadController,
} from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  controllers: [UploadController, UserUploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
