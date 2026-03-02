import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { NewsCategory } from 'generated/prisma/enums';

export class UpdateNewsDto {
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
  @IsEnum(NewsCategory)
  category?: NewsCategory;

  @IsOptional()
  @IsBoolean()
  add_to_carousel?: boolean;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
