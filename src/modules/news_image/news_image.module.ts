import { Module } from '@nestjs/common';
import { NewsImageController } from 'src/modules/news_image/news_image.controller';
import { NewsImageService } from 'src/modules/news_image/news_image.service';

@Module({
  controllers: [NewsImageController],
  providers: [NewsImageService],
  exports: [NewsImageService],
})
export class NewsImageModule {}
