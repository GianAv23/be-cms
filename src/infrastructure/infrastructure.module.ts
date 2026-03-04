import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { LocalBucketModule } from 'src/infrastructure/local_bucket/local_bucket.module';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';

@Global()
@Module({
  imports: [
    PrismaModule,
    LocalBucketModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '12h' },
      }),
      inject: [ConfigService],
      global: true,
    }),
  ],
  exports: [PrismaModule, LocalBucketModule],
})
export class InfrastructureModule {}
