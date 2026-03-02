import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { ImageCategory } from 'generated/prisma/enums';
import { join } from 'node:path';
import { IStorageBucketService } from 'src/common/interfaces/storage_bucket/storage_bucket.service.interface';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LocalBucketService implements IStorageBucketService {
  private readonly MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
  };

  private readonly CATEGORY_TO_ENV_MAP = {
    NEWS_IMAGE: 'NEWS_PHOTO_UPLOAD_FOLDER_NAME',
    ADS_IMAGE: 'ADS_PHOTO_UPLOAD_FOLDER_NAME',
  };

  private readonly CATEGORY_TO_PRISMA_MAP = {
    NEWS_IMAGE: 'newsPhoto',
    ADS_IMAGE: 'adsPhoto',
  };

  private readonly CATEGORY_TO_LINK_MAP = {
    NEWS_IMAGE: 'news-picture',
    ADS_IMAGE: 'ads-picture',
  };

  private readonly CATEGORY_TO_PARENT_ATTRIBUTE_MAP = {
    NEWS_IMAGE: 'news_uuid',
    ADS_IMAGE: 'ads_uuid',
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async delete(): Promise<void> {
    return;
  }

  async save(): Promise<void> {
    return;
  }

  // Wrapper to write files asynchronously
  private async writeStreamAsync(
    filePath: string,
    dataIterable: Express.Multer.File,
  ) {
    try {
      await fs.writeFile(filePath, dataIterable.buffer);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async uploadPicture(
    picture: Express.Multer.File,
    category: ImageCategory,
  ): Promise<string> {
    let fileLink: string;
    try {
      fileLink = `${uuidv4()}.${this.MIME_TYPE_MAP[picture.mimetype]}`;

      await this.writeStreamAsync(
        join(
          process.cwd(),
          'uploads',
          this.configService.getOrThrow(
            this.CATEGORY_TO_ENV_MAP[`${category}`],
          ),
          fileLink,
        ),
        picture,
      );
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
    return fileLink;
  }

  async getPictureLinkFromParentUUID(
    parentUUID: string,
    category: ImageCategory,
  ): Promise<string> {
    let fileLink: string;
    try {
      const res = await this.prisma[
        this.CATEGORY_TO_PRISMA_MAP[category]
      ].findUnique({
        where: {
          [this.CATEGORY_TO_PARENT_ATTRIBUTE_MAP[category]]: parentUUID,
        },
      });

      if (!res || !res?.link) {
        throw new NotFoundException();
      }

      fileLink = `${this.configService.getOrThrow('API_URL')}/v1/${this.CATEGORY_TO_LINK_MAP[category]}/photo/${res.link}`;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
    return fileLink;
  }

  async getPictureFile(
    pictureLink: string,
    category: ImageCategory,
  ): Promise<Buffer<ArrayBufferLike>> {
    try {
      const filePath = join(
        process.cwd(),
        'uploads',
        this.configService.getOrThrow(this.CATEGORY_TO_ENV_MAP[category]),
        pictureLink,
      );

      return await fs.readFile(filePath);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async deletePictureFromPictureLink(
    pictureLink: string,
    category: ImageCategory,
  ): Promise<void> {
    try {
      const filePath = join(
        process.cwd(),
        'uploads',
        this.configService.getOrThrow(this.CATEGORY_TO_ENV_MAP[category]),
        pictureLink,
      );

      await fs.unlink(filePath);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
    return;
  }

  async getPictureLinksFromParentUUID(
    parentUUID: string,
    category: ImageCategory,
  ): Promise<Array<string>> {
    const fileLink: Array<string> = [];
    try {
      const res = await this.prisma[
        this.CATEGORY_TO_PRISMA_MAP[category]
      ].findMany({
        where: {
          [this.CATEGORY_TO_PARENT_ATTRIBUTE_MAP[category]]: parentUUID,
        },
        orderBy: {
          order: 'asc',
        },
      });

      if (!res) {
        throw new NotFoundException();
      }

      for (const row of res) {
        fileLink.push(
          `${this.configService.getOrThrow('API_URL')}/v1/${this.CATEGORY_TO_LINK_MAP[category]}/photo/${row.link}`,
        );
      }
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
    return fileLink;
  }
}
