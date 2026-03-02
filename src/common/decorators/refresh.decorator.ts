import { SetMetadata } from '@nestjs/common';

export const IS_REFRESH_ROUTE = 'isRefresh';
export const Refresh = () => SetMetadata(IS_REFRESH_ROUTE, true);
