import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { IS_REFRESH_ROUTE } from 'src/common/decorators/refresh.decorator';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isRefresh = this.reflector.getAllAndOverride<boolean>(
      IS_REFRESH_ROUTE,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request: Request = context.switchToHttp().getRequest();

    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    let payload: any;

    try {
      if (!isRefresh) {
        payload = await this.jwtService.verifyAsync(token.jwt, {
          secret: process.env.JWT_SECRET,
        });
      } else {
        payload = await this.jwtService.verifyAsync(token.jwt_refresh, {
          secret: process.env.JWT_SECRET,
        });
      }

      request['user'] = payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException();
    }
    try {
      const userUUID = payload['sub'];
      const uniqueUUID = payload['uniqueUUID'];

      const res = await this.prisma.user.findUnique({
        where: {
          uuid: userUUID,
        },
        select: {
          session_token: true,
        },
      });

      if (uniqueUUID !== res?.session_token) {
        throw new UnauthorizedException();
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException('another device has logged in.');
      }
      throw new InternalServerErrorException('failed to find user');
    }
    return true;
  }

  private extractTokenFromHeader(
    request: Request,
  ): { jwt: string; jwt_refresh: string } | undefined {
    if (request.cookies?.jwt && request.cookies?.jwt_refresh) {
      return {
        jwt: request.cookies.jwt,
        jwt_refresh: request.cookies.jwt_refresh,
      };
    }

    return undefined;
  }
}
