import { Module } from '@nestjs/common';
import { AdsImageController } from './ads_image.controller';
import { AdsImageService } from './ads_image.service';

@Module({
  controllers: [AdsImageController],
  providers: [AdsImageService],
  exports: [AdsImageService],
})
export class AdsImageModule {}
