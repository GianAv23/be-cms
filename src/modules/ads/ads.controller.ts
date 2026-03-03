import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from 'generated/prisma/enums';
import { Role } from 'src/common/decorators/role.decorator';
import { responseDto } from 'src/common/dto/response.dto';
import { RoleGuard } from 'src/common/guards/role.guard';
import { AdsService } from './ads.service';
import { CreateAdsDto } from './dto/create-ads.dto';
import { GetAdsDto } from './dto/get-ads.dto';
import { UpdateAdsDto } from './dto/update-ads.dto';

@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @UseGuards(RoleGuard)
  @Role([Roles.ADMIN, Roles.ADS_EDITOR])
  @Post('create')
  async createAds(@Body() createAdsDto: CreateAdsDto, @Res() res: Response) {
    const result = await this.adsService.createAds(createAdsDto);
    const response = new responseDto('Success create ads', result);
    return res.status(201).json({ response });
  }

  @UseGuards(RoleGuard)
  @Role([Roles.ADMIN, Roles.ADS_EDITOR])
  @Patch(':uuid')
  async editAds(
    @Param('uuid') uuid: string,
    @Body() updateAdsDto: UpdateAdsDto,
    @Res() res: Response,
  ) {
    const result = await this.adsService.editAds(uuid, updateAdsDto);
    const response = new responseDto(
      `Success edit ads ${result!.title}`,
      result,
    );
    return res.status(201).json({ response });
  }

  @UseGuards(RoleGuard)
  @Role([Roles.ADMIN, Roles.ADS_EDITOR])
  @Delete(':uuid')
  async deleteAds(@Param('uuid') uuid: string, @Res() res: Response) {
    const result = await this.adsService.deleteAds(uuid);
    const response = new responseDto(`Success delete ads`, result);
    return res.status(200).json({ response });
  }

  @UseGuards(RoleGuard)
  @Role([Roles.ADMIN, Roles.ADS_EDITOR])
  @Get('ads-cms')
  async getAllAdsCms(
    @Query(
      new ValidationPipe({
        transform: true,
        forbidNonWhitelisted: true,
      }),
    )
    query: GetAdsDto,
    @Res() res: Response,
  ) {
    const result = await this.adsService.getAllAdsCms(query);
    const response = new responseDto('Success get all ads for cms', result);
    return res.status(200).json({ response });
  }

  @UseGuards(RoleGuard)
  @Role([Roles.ADMIN, Roles.ADS_EDITOR])
  @Get('ads-cms/:uuid')
  async getAdsByIdCms(@Param('uuid') uuid: string, @Res() res: Response) {
    const result = await this.adsService.getAdsByIdCms(uuid);
    const response = new responseDto(`Success get ads with id ${uuid}`, result);
    return res.status(200).json({ response });
  }
}
