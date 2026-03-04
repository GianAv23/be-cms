import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { AdsCategory } from 'generated/prisma/enums';
export class CreateAdsDto {
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsEnum(AdsCategory)
  category: AdsCategory;

  @IsNotEmpty()
  @IsString()
  external_link: string;

  @IsOptional()
  @IsString()
  partner_name?: string | null;
}
