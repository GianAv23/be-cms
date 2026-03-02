import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LocalBucketModule } from 'src/infrastructure/local_bucket/local_bucket.module';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';

@Global()
@Module({
  imports: [
    PrismaModule,
    LocalBucketModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '12h' },
    }),
  ],
  exports: [PrismaModule, LocalBucketModule],
})
export class InfrastructureModule {}
