import { Module } from '@nestjs/common';
import { LocalBucketService } from 'src/infrastructure/local_bucket/local_bucket.service';

@Module({
  providers: [
    LocalBucketService,
    {
      useClass: LocalBucketService,
      provide: 'IStorageBucketService',
    },
  ],
  exports: [
    LocalBucketService,
    {
      useClass: LocalBucketService,
      provide: 'IStorageBucketService',
    },
  ],
})
export class LocalBucketModule {}
