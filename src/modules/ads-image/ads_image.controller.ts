import {
  Controller,
  FileTypeValidator,
  Get,
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
import { AdsImageService } from './ads_image.service';

@Controller('ads-image')
export class AdsImageController {
  constructor(private readonly adsImageService: AdsImageService) {}

  @Public()
  @Get('image/:image_link')
  async getAdsImage(
    @Res() res: Response,
    @Param('image_link') imageLink: string,
  ) {
    const result = await this.adsImageService.getAdsImageFile(imageLink);

    return res.status(200).type(result.fileType).send(result.fileBuffer);
  }

  @Get(':uuid')
  async getAdsImageLink(@Res() res: Response, @Param('uuid') uuid: string) {
    const result = await this.adsImageService.getAdsImageByAdsUUID(uuid);

    const response = new responseDto('Success!', result);
    return res.status(200).json({
      response,
    });
  }

  @UseGuards(RoleGuard)
  @Role([Roles.ADMIN, Roles.ADS_EDITOR])
  @UseInterceptors(FileInterceptor('image'))
  @Post(':uuid')
  async createOrUpdateAdsImage(
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
    const result = await this.adsImageService.uploadAdsImage(uuid, file);

    const response = new responseDto('Success!', result);
    return res.status(200).json({
      response,
    });
  }
}
