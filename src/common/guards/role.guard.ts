import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from 'generated/prisma/enums';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  matchRoles(roles: Roles[], userRoles: Roles[]) {
    for (const role of roles) {
      for (const userRole of userRoles) {
        if (role === userRole) {
          return true;
        }
      }
    }
    return false;
  }

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.get('role', context.getHandler());
    if (!roles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return this.matchRoles(roles, user.role);
  }
}
