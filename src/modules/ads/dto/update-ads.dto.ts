import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { AdsCategory } from 'generated/prisma/enums';

export class UpdateAdsDto {
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsString()
  uuid: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(AdsCategory)
  category?: AdsCategory;

  @IsOptional()
  @IsString()
  external_link?: string | null;

  @IsOptional()
  @IsString()
  partner_name?: string | null;
}
