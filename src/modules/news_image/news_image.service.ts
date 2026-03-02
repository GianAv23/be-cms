import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ImageExtension } from 'generated/prisma/enums';
import type { IStorageBucketService } from 'src/common/interfaces/storage_bucket/storage_bucket.service.interface';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class NewsImageService {
  private readonly MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
  };

  constructor(
    private readonly prisma: PrismaService,
    @Inject('IStorageBucketService')
    private readonly storageBucket: IStorageBucketService,
  ) {}

  async getNewsImageByNewsUUID(news_uuid: string) {
    try {
      const newsImageMetadata = await this.prisma.newsImage.findFirst({
        where: {
          news_uuid: news_uuid,
        },
      });

      if (!newsImageMetadata) {
        return;
      }

      const newsImageLink = await this.storageBucket.getImageLinkFromParentUUID(
        newsImageMetadata.news_uuid,
        'NEWS_IMAGE',
      );
      if (!newsImageLink) {
        throw new NotFoundException('No image uploaded for this news');
      }

      return newsImageLink;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }

  async uploadNewsImage(newsUUID: string, newsImage: Express.Multer.File) {
    try {
      let isImageAlreadyAvailable: boolean = false;
      let currentImageLink: string | null = null;

      const currentNewsImage = await this.prisma.newsImage.findFirst({
        where: { news_uuid: newsUUID },
      });
      if (currentNewsImage) {
        isImageAlreadyAvailable = true;
        currentImageLink = currentNewsImage.link;
      }

      const newImageLink = await this.storageBucket.uploadImage(
        newsImage,
        'NEWS_IMAGE',
      );

      if (!newImageLink) {
        throw new InternalServerErrorException('news image not created');
      }
      const extension: string = this.MIME_TYPE_MAP[newsImage.mimetype];
      const result = await this.prisma.newsImage.upsert({
        where: {
          news_uuid: newsUUID,
        },
        create: {
          news_uuid: newsUUID,
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
          'NEWS_IMAGE',
        );
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }

  async getNewsImageFile(imageLink: string) {
    try {
      const fileBuffer = await this.storageBucket.getImageFile(
        imageLink,
        'NEWS_IMAGE',
      );

      const extension = imageLink.split('.').pop();
      return { fileBuffer: fileBuffer, fileType: `image/${extension}` };
    } catch (error) {
      throw new HttpException(error, 500);
    }
  }

  async uploadGalleryImage(
    newsUUID: string,
    galleryImage: Express.Multer.File,
  ) {
    try {
      const newImageLink = await this.storageBucket.uploadImage(
        galleryImage,
        'NEWS_IMAGE_GALLERY',
      );

      if (!newImageLink) {
        throw new InternalServerErrorException(
          'news gallery image not created',
        );
      }
      const extension: string = this.MIME_TYPE_MAP[galleryImage.mimetype];

      const result = await this.prisma.newsImageGallery.create({
        data: {
          news_uuid: newsUUID,
          fileType:
            ImageExtension[
              extension.toUpperCase() as keyof typeof ImageExtension
            ],
          link: newImageLink,
        },
      });

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }

  async deleteNewsGalleryImage(news_uuid: string, image_link: string) {
    try {
      const checkGalleryImage = await this.prisma.newsImageGallery.findFirst({
        where: {
          news_uuid: news_uuid,
          link: image_link,
        },
      });

      if (!checkGalleryImage) {
        throw new NotFoundException('Gallery image not found');
      }

      await this.prisma.newsImageGallery.delete({
        where: {
          news_uuid: news_uuid,
          link: image_link,
        },
      });

      await this.storageBucket.deleteImageFromImageLink(
        image_link,
        'NEWS_IMAGE_GALLERY',
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }

  async getNewsGalleryByNewsUUID(news_uuid: string) {
    try {
      const newsGalleryMetadata = await this.prisma.newsImageGallery.findMany({
        where: {
          news_uuid: news_uuid,
        },
      });

      if (newsGalleryMetadata.length === 0) {
        throw new NotFoundException('No image uploaded for this news');
      }

      const newsGalleryLinks =
        await this.storageBucket.getImageLinksFromParentUUID(
          newsGalleryMetadata[0].news_uuid,
          'NEWS_IMAGE_GALLERY',
        );
      if (!newsGalleryLinks) {
        throw new NotFoundException('No image uploaded for this news');
      }

      return newsGalleryLinks;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }

  async getNewsGalleryFile(imageLink: string) {
    try {
      const fileBuffer = await this.storageBucket.getImageFile(
        imageLink,
        'NEWS_IMAGE_GALLERY',
      );

      const extension = imageLink.split('.').pop();
      return { fileBuffer: fileBuffer, fileType: `image/${extension}` };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }

  async viewGalleryIdsByNewsUUID(newsUUID: string) {
    try {
      const imageGallery = await this.prisma.newsImageGallery.findMany({
        where: {
          news_uuid: newsUUID,
        },
        select: {
          uuid: true,
          link: true,
        },
      });

      if (!imageGallery) {
        throw new NotFoundException();
      }
      return imageGallery;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          'NewsUUID not valid or has no gallery',
          HttpStatus.NOT_FOUND,
        );
      }
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }
}
