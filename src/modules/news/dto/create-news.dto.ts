import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { NewsCategory } from 'generated/prisma/enums';

export class CreateNewsDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsEnum(NewsCategory)
  category: NewsCategory;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
