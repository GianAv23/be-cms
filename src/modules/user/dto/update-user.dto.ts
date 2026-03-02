import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsNotEmpty } from 'class-validator';
import { Roles } from 'generated/prisma/enums';

export class UpdateAdminDto {
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(Roles, { each: true })
  roles: Roles[];
}
