import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from 'generated/prisma/enums';
import { Role } from 'src/common/decorators/role.decorator';
import { responseDto } from 'src/common/dto/response.dto';
import { RoleGuard } from 'src/common/guards/role.guard';
import type { ExpressRequestWithUser } from '../user/interfaces/express-req-with-user';
import { CreateNewsDto } from './dto/create-news.dto';
import { GetNewsDto } from './dto/get-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @UseGuards(RoleGuard)
  @Role([Roles.ADMIN, Roles.NEWS_EDITOR])
  @Post('create')
  async createNews(
    @Body() createNewsDto: CreateNewsDto,
    @Req() req: ExpressRequestWithUser,
    @Res() res: Response,
  ) {
    const result = await this.newsService.createNews(
      req.user.sub,
      createNewsDto,
    );

    const response = new responseDto('News created successfully', result);
    return res.status(201).json({ response });
  }

  @UseGuards(RoleGuard)
  @Role([Roles.ADMIN, Roles.NEWS_EDITOR])
  @Patch(':uuid')
  async updateNews(
    @Param('uuid') uuid: string,
    @Body() updateNewsDto: UpdateNewsDto,
    @Req() req: ExpressRequestWithUser,
    @Res() res: Response,
  ) {
    const result = await this.newsService.updateNews(
      req.user.sub,
      uuid,
      updateNewsDto,
    );

    const response = new responseDto('News updated successfully', result);
    return res.status(200).json({ response });
  }

  @UseGuards(RoleGuard)
  @Role([Roles.ADMIN, Roles.NEWS_EDITOR])
  @Delete(':uuid')
  async deleteNews(
    @Param('uuid') uuid: string,
    @Req() req: ExpressRequestWithUser,
    @Res() res: Response,
  ) {
    const result = await this.newsService.deleteNews(uuid, req.user.sub);

    const response = new responseDto(`Success delete news`, result);

    return res.status(200).json({ response });
  }

  @UseGuards(RoleGuard)
  @Role([Roles.ADMIN, Roles.NEWS_EDITOR])
  @Get('news-cms')
  async getAllNewsCms(
    @Query(
      new ValidationPipe({
        transform: true,
        forbidNonWhitelisted: true,
      }),
    )
    query: GetNewsDto,
    @Res() res: Response,
  ) {
    const result = await this.newsService.getAllNewsCms(query);

    const response = new responseDto('Success get all news for cms', result);

    return res.status(200).json({ response });
  }

  @UseGuards(RoleGuard)
  @Role([Roles.ADMIN, Roles.NEWS_EDITOR])
  @Get('news-cms/:uuid')
  async getNewsByIdCms(@Param('uuid') uuid: string, @Res() res: Response) {
    const result = await this.newsService.getNewsByIdCms(uuid);

    const response = new responseDto(
      `Success get news with id ${uuid}`,
      result,
    );

    return res.status(200).json({ response });
  }

  @UseGuards(RoleGuard)
  @Role([Roles.ADMIN, Roles.NEWS_EDITOR])
  @Get('stats/categorydistribution')
  async getNewsCategoryDistribution(@Res() res: Response) {
    const result = await this.newsService.getNewsCategoryDistribution();
    const response = new responseDto(
      'Success get news category distribution',
      result,
    );
    return res.status(200).json({ response });
  }
}
