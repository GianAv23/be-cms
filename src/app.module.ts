import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthGuard } from './common/guards/auth.guard';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AdsImageModule } from './modules/ads-image/ads_image.module';
import { AdsModule } from './modules/ads/ads.module';
import { NewsModule } from './modules/news/news.module';
import { NewsImageModule } from './modules/news_image/news_image.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    InfrastructureModule,
    UserModule,
    NewsModule,
    NewsImageModule,
    AdsModule,
    AdsImageModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
