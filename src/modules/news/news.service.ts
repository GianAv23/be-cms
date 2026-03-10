import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { NewsCategory } from 'generated/prisma/client';
import type { IStorageBucketService } from 'src/common/interfaces/storage_bucket/storage_bucket.service.interface';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { GetNewsDto } from './dto/get-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Injectable()
export class NewsService {
  constructor(
    private readonly db: PrismaService,
    @Inject('IStorageBucketService')
    private readonly storageBucketService: IStorageBucketService,
  ) {}

  async createNews(user_uuid: string, createNewsDto: CreateNewsDto) {
    try {
      const result = await this.db.$transaction(async (tx) => {
        const addNews = await tx.news.create({
          data: {
            title: createNewsDto.title,
            content: createNewsDto.content,
            category: createNewsDto.category,
            published: createNewsDto.published,
          },
        });

        await tx.adminNews.create({
          data: {
            user_uuid: user_uuid,
            news_uuid: addNews.uuid,
            created_by: true, // mark as original creator
          },
        });

        return addNews;
      });

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to create news: ${error.message}`,
      );
    }
  }

  async updateNews(
    user_uuid: string,
    uuid: string,
    updateNewsDto: UpdateNewsDto,
  ) {
    try {
      const existingNews = await this.db.news.findUnique({
        where: {
          uuid: uuid,
        },
      });

      if (!existingNews) {
        throw new NotFoundException(`News with uuid ${uuid} not found`);
      }

      const result = await this.db.$transaction(async (tx) => {
        const updateNews = await tx.news.update({
          where: {
            uuid: uuid,
          },
          data: {
            title: updateNewsDto.title,
            content: updateNewsDto.content,
            category: updateNewsDto.category,
            published: updateNewsDto.published,
          },
        });

        await tx.adminNews.upsert({
          where: {
            user_uuid_news_uuid: {
              user_uuid: user_uuid,
              news_uuid: updateNews.uuid,
            },
          },
          create: {
            user_uuid: user_uuid,
            news_uuid: updateNews.uuid,
          },
          update: {
            user_uuid: user_uuid,
            created_at: new Date(),
          },
        });

        return updateNews;
      });

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to update news: ${error.message}`,
      );
    }
  }

  async deleteNews(uuid: string, user_uuid: string) {
    try {
      const deletedNews = await this.db.news.findUnique({
        where: {
          uuid: uuid,
        },
        include: {
          NewsImage: true,
          NewsImageGallery: true,
        },
      });

      if (!deletedNews) {
        throw new NotFoundException(`News with uuid ${uuid} not found`);
      }

      const imageLink = deletedNews.NewsImage?.link;
      const galleryImageLinks = deletedNews.NewsImageGallery.map(
        (image) => image.link,
      ).filter((link): link is string => link !== null);

      if (deletedNews.NewsImage) {
        await this.db.newsImage.deleteMany({
          where: {
            news_uuid: uuid,
          },
        });
      }

      await this.db.adminNews.deleteMany({
        where: {
          news_uuid: uuid,
        },
      });

      await this.db.news.delete({
        where: {
          uuid: uuid,
        },
      });

      await Promise.all([
        imageLink
          ? this.storageBucketService.deleteImageFromImageLink(
              imageLink,
              'NEWS_IMAGE',
            )
          : Promise.resolve(),
        ...galleryImageLinks.map((galleryImageLink) =>
          this.storageBucketService.deleteImageFromImageLink(
            galleryImageLink,
            'NEWS_IMAGE_GALLERY',
          ),
        ),
      ]);

      return {
        message: `Success deleted news ${deletedNews.title} by ${user_uuid} `,
        data: deletedNews,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to delete news: ${error.message}`,
      );
    }
  }

  async getAllNewsCms(getNewsDto: GetNewsDto) {
    try {
      const page = getNewsDto.page ?? 1;
      const limit = getNewsDto.limit ?? 10;

      const whereClause = {
        category: getNewsDto.category || undefined,
        published:
          getNewsDto.published !== undefined ? getNewsDto.published : undefined,
        ...(getNewsDto.search
          ? {
              OR: [
                {
                  title: {
                    contains: getNewsDto.search,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  content: {
                    contains: getNewsDto.search,
                    mode: 'insensitive' as const,
                  },
                },
              ],
            }
          : {}),
      };

      const [news, total] = await Promise.all([
        this.db.news.findMany({
          orderBy: { updated_at: 'desc' },
          where: whereClause,
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.db.news.count({ where: whereClause }),
      ]);

      return {
        news,
        total,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to get all news: ${error.message}`,
      );
    }
  }

  async getNewsByIdCms(uuid: string) {
    try {
      const result = await this.db.news.findUnique({
        where: {
          uuid: uuid,
        },
        include: {
          AdminNews: {
            include: {
              User: {
                select: {
                  full_name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!result) {
        throw new NotFoundException(`News with uuid ${uuid} not found`);
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to get news by id: ${error.message}`,
      );
    }
  }

  async getNewsCategoryDistribution() {
    try {
      const allCategories = Object.values(NewsCategory);

      const categoryMap = new Map(
        allCategories.map((category) => [category, 0]),
      );

      const result = await this.db.news.groupBy({
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
        `Failed to get news category distribution: ${error.message}`,
      );
    }
  }
}
