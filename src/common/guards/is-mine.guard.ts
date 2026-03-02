import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class IsMineGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    return request.params.uuid === request.user.sub;
  }
}
