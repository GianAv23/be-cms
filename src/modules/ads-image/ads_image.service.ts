import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ImageExtension } from 'generated/prisma/enums';
import type { IStorageBucketService } from 'src/common/interfaces/storage_bucket/storage_bucket.service.interface';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class AdsImageService {
  private readonly MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
  };

  constructor(
    private readonly db: PrismaService,
    @Inject('IStorageBucketService')
    private readonly storageBucket: IStorageBucketService,
  ) {}

  async getAdsImageByAdsUUID(ads_uuid: string) {
    try {
      const adsImageMetadata = await this.db.adsImage.findFirst({
        where: {
          ads_uuid: ads_uuid,
        },
      });

      if (!adsImageMetadata) {
        return;
      }

      const adsImageLink = await this.storageBucket.getImageLinkFromParentUUID(
        adsImageMetadata.ads_uuid,
        'ADS_IMAGE',
      );
      if (!adsImageLink) {
        throw new NotFoundException('No image uploaded for this ads');
      }

      return adsImageLink;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to get ads image: ${error.message}`,
      );
    }
  }

  async uploadAdsImage(adsUUID: string, adsImage: Express.Multer.File) {
    try {
      let isImageAlreadyAvailable: boolean = false;
      let currentImageLink: string | null = null;

      const currentAdsImage = await this.db.adsImage.findFirst({
        where: { ads_uuid: adsUUID },
      });
      if (currentAdsImage) {
        isImageAlreadyAvailable = true;
        currentImageLink = currentAdsImage.link;
      }

      const newImageLink = await this.storageBucket.uploadImage(
        adsImage,
        'ADS_IMAGE',
      );

      if (!newImageLink) {
        throw new InternalServerErrorException('ads image not created');
      }
      const extension: string = this.MIME_TYPE_MAP[adsImage.mimetype];
      const result = await this.db.adsImage.upsert({
        where: {
          ads_uuid: adsUUID,
        },
        create: {
          ads_uuid: adsUUID,
          file_type:
            ImageExtension[
              extension.toUpperCase() as keyof typeof ImageExtension
            ],
          link: newImageLink,
        },
        update: {
          file_type:
            ImageExtension[
              extension.toUpperCase() as keyof typeof ImageExtension
            ],
          link: newImageLink,
          updated_at: new Date(),
        },
      });

      if (isImageAlreadyAvailable && currentImageLink) {
        await this.storageBucket.deleteImageFromImageLink(
          currentImageLink,
          'ADS_IMAGE',
        );
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to upload ads image: ${error.message}`,
      );
    }
  }

  async getAdsImageFile(imageLink: string) {
    const fileBuffer = await this.storageBucket.getImageFile(
      imageLink,
      'ADS_IMAGE',
    );

    const extension = imageLink.split('.').pop();
    return { fileBuffer: fileBuffer, fileType: `image/${extension}` };
  }
}
