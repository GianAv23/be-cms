import {
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpException,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Roles } from 'generated/prisma/enums';
import { Public } from 'src/common/decorators/public.decorator';
import { Role } from 'src/common/decorators/role.decorator';
import { responseDto } from 'src/common/dto/response.dto';
import { RoleGuard } from 'src/common/guards/role.guard';
import { NewsImageService } from './news_image.service';

@Controller('news-image')
export class NewsImageController {
  constructor(private readonly newsImageService: NewsImageService) {}

  @Public()
  @Get('image/:image_link')
  async getNewsImage(
    @Res() res: Response,
    @Param('image_link') imageLink: string,
  ) {
    const result = await this.newsImageService.getNewsImageFile(imageLink);

    return res.status(200).type(result.fileType).send(result.fileBuffer);
  }

  @Get('gallery/link/:uuid')
  async getGalleryImagesLink(
    @Res() res: Response,
    @Param('uuid') uuid: string,
  ) {
    const result = await this.newsImageService.getNewsGalleryByNewsUUID(uuid);

    const response = new responseDto('Success!', result);
    return res.status(200).json({
      response,
    });
  }

  @Delete('gallery/:news_uuid/:image_link')
  async deleteGalleryImage(
    @Res() res: Response,
    @Param('news_uuid') newsUUID: string,
    @Param('image_link') imageLink: string,
  ) {
    const result = await this.newsImageService.deleteNewsGalleryImage(
      newsUUID,
      imageLink,
    );
    const response = new responseDto('Success!', result);
    return res.status(200).json({
      response,
    });
  }

  @Get('gallery/metadata/:news_uuid')
  async getGalleryMetadata(
    @Res() res: Response,
    @Param('news_uuid') newsUUID: string,
  ) {
    const result =
      await this.newsImageService.viewGalleryIdsByNewsUUID(newsUUID);

    const response = new responseDto('Success!', result);
    return res.status(200).json({
      response,
    });
  }

  @Public()
  @Get('show-gallery/:gallery_image_link')
  async getGalleryImage(
    @Res() res: Response,
    @Param('gallery_image_link') imageLink: string,
  ) {
    const result = await this.newsImageService.getNewsGalleryFile(imageLink);

    if (!result) {
      throw new HttpException('Image not found', 404);
    }

    return res.status(200).type(result.fileType).send(result.fileBuffer);
  }

  @Get(':uuid')
  async getNewsImageLink(@Res() res: Response, @Param('uuid') uuid: string) {
    const result = await this.newsImageService.getNewsImageByNewsUUID(uuid);

    const response = new responseDto('Success!', result);
    return res.status(200).json({
      response,
    });
  }

  @UseGuards(RoleGuard)
  @Role([Roles.ADMIN, Roles.NEWS_EDITOR])
  @UseInterceptors(FileInterceptor('image'))
  @Post('gallery/:uuid')
  async createGalleryImage(
    @Res() res: Response,
    @Param('uuid') uuid: string,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: Math.pow(10, 7) }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const result = await this.newsImageService.uploadGalleryImage(uuid, file);

    const response = new responseDto('Success!', result);
    return res.status(200).json({
      response,
    });
  }

  @UseGuards(RoleGuard)
  @Role([Roles.ADMIN, Roles.NEWS_EDITOR])
  @UseInterceptors(FileInterceptor('image'))
  @Post(':uuid')
  async createOrUpdateNewsImage(
    @Res() res: Response,
    @Param('uuid') uuid: string,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: Math.pow(10, 7) }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const result = await this.newsImageService.uploadNewsImage(uuid, file);

    const response = new responseDto('Success!', result);
    return res.status(200).json({
      response,
    });
  }
}
