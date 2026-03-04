import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AdsCategory } from 'generated/prisma/enums';
import type { IStorageBucketService } from 'src/common/interfaces/storage_bucket/storage_bucket.service.interface';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateAdsDto } from './dto/create-ads.dto';
import { GetAdsDto } from './dto/get-ads.dto';
import { UpdateAdsDto } from './dto/update-ads.dto';

@Injectable()
export class AdsService {
  constructor(
    private readonly db: PrismaService,
    @Inject('IStorageBucketService')
    private readonly storageBucketService: IStorageBucketService,
  ) {}

  async createAds(dto: CreateAdsDto) {
    try {
      this.validatePartnerName(dto.category, dto.partner_name ?? undefined);

      const addAds = await this.db.ads.create({
        data: {
          title: dto.title,
          content: dto.content,
          category: dto.category,
          partner_name: dto.partner_name ?? undefined,
          external_link: dto.external_link,
          published: dto.published,
        },
      });

      return addAds;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to create ads: ${error.message}`,
      );
    }
  }

  async editAds(uuid: string, dto: UpdateAdsDto) {
    try {
      const existingAds = await this.db.ads.findUnique({
        where: {
          uuid: uuid,
        },
      });

      if (!existingAds) {
        throw new NotFoundException(`Ads with uuid ${uuid} not found`);
      }

      const updatedAds = await this.db.ads.update({
        where: {
          uuid: uuid,
        },
        data: {
          title: dto.title,
          content: dto.content,
          category: dto.category,
          partner_name: dto.partner_name ?? undefined,
          external_link: dto.external_link,
          published: dto.published,
        },
      });

      return updatedAds;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to edit ads: ${error.message}`,
      );
    }
  }

  async deleteAds(uuid: string) {
    try {
      const deletedAds = await this.db.ads.findUnique({
        where: {
          uuid: uuid,
        },
        include: {
          AdsImage: true,
        },
      });

      if (!deletedAds) {
        throw new NotFoundException(`Ads with uuid ${uuid} not found`);
      }

      const imageLink = deletedAds.AdsImage?.link;

      if (deletedAds.AdsImage) {
        await this.db.adsImage.deleteMany({
          where: {
            ads_uuid: uuid,
          },
        });
      }

      await this.db.ads.delete({
        where: {
          uuid: uuid,
        },
      });

      if (imageLink) {
        await this.storageBucketService.deleteImageFromImageLink(
          imageLink,
          'ADS_IMAGE',
        );
      }

      return deletedAds;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to delete ads: ${error.message}`,
      );
    }
  }

  async getAllAdsCms(dto: GetAdsDto) {
    try {
      const page = dto.page ?? 1;
      const limit = dto.limit ?? 10;

      const whereClause = {
        category: dto.category || undefined,
        published: dto.published !== undefined ? dto.published : undefined,
        ...(dto.published
          ? {
              OR: [
                {
                  title: {
                    contains: dto.search,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  content: {
                    contains: dto.search,
                    mode: 'insensitive' as const,
                  },
                },
              ],
            }
          : {}),
      };

      const [ads, total] = await Promise.all([
        this.db.ads.findMany({
          orderBy: { updated_at: 'desc' },
          where: whereClause,
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.db.ads.count({
          where: whereClause,
        }),
      ]);

      return {
        ads,
        total,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to get all ads: ${error.message}`,
      );
    }
  }

  async getAdsByIdCms(uuid: string) {
    try {
      const result = await this.db.ads.findUnique({
        where: {
          uuid: uuid,
        },
      });

      if (!result) {
        throw new NotFoundException(`Ads with uuid ${uuid} not found`);
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to get ads by id: ${error.message}`,
      );
    }
  }

  async getAdsCategoryDistribution() {
    try {
      const allCategories = Object.values(AdsCategory);

      const categoryMap = new Map(
        allCategories.map((category) => [category, 0]),
      );

      const result = await this.db.ads.groupBy({
        by: ['category'],
        _count: {
          category: true,
        },
      });

      result.forEach((item) => {
        categoryMap.set(item.category, item._count.category);
      });

      return Array.from(categoryMap.entries()).map(([category, count]) => ({
        category,
        count,
      }));
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to get ads category distribution: ${error.message}`,
      );
    }
  }

  // Helper function to validate partner name based on ads category
  private validatePartnerName(
    category: AdsCategory,
    partnerName?: string,
  ): void {
    if (category === AdsCategory.EXTERNAL) {
      if (!partnerName || partnerName.trim().length === 0) {
        throw new BadRequestException(
          'Partner name is required for external ads',
        );
      }
    }

    if (category === AdsCategory.INTERNAL) {
      if (partnerName && partnerName.trim().length > 0) {
        throw new BadRequestException(
          'Partner name must be empty for internal ads',
        );
      }
    }
  }
}
