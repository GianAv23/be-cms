import { SetMetadata } from '@nestjs/common';
import { Roles } from 'generated/prisma/enums';

export const Role = (args: Roles[]) => SetMetadata('roles', args);
