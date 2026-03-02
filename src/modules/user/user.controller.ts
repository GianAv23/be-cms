import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  // Request,
  Res,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from 'generated/prisma/enums';
import { Public } from 'src/common/decorators/public.decorator';
import { Refresh } from 'src/common/decorators/refresh.decorator';
import { Role } from 'src/common/decorators/role.decorator';
import { responseDto } from 'src/common/dto/response.dto';
import { RoleGuard } from 'src/common/guards/role.guard';
import { AddUserDto } from './dto/add-user.dto';
import { GetAllUserDto } from './dto/get-all-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateAdminDto } from './dto/update-user.dto';
import type { ExpressRequestWithUser } from './interfaces/express-req-with-user';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // POST: /users/register
  @Public()
  @Post('register')
  async registerUser(
    @Body(
      new ValidationPipe({
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    )
    registerUser: RegisterUserDto,
    @Res() res: Response,
  ) {
    const result = await this.userService.registerUser(registerUser);
    const response = new responseDto('User registered successfully', result);
    return res.status(201).json({ response });
  }

  // POST: /users/login
  @Public()
  @Post('login')
  async loginUser(@Body() loginUser: LoginUserDto, @Res() res: Response) {
    try {
      const result = await this.userService.loginUser(loginUser);

      if (!result || !result.access_token || !result.refresh_token) {
        throw new UnauthorizedException('Failed to generate tokens');
      }

      res.cookie('jwt', result.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });

      res.cookie('jwt_refresh', result.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });

      const response = new responseDto('Login success', result);

      return res.status(200).json({ response });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      if (error instanceof HttpException) {
        throw error;
      }

      throw error;
    }
  }

  // POST: /users/logout
  @Post('logout')
  async logout(@Req() req: ExpressRequestWithUser, @Res() res: Response) {
    try {
      const user = req.user;

      res.clearCookie('jwt', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });

      res.clearCookie('jwt_refresh', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });

      const response = new responseDto('Logout success', user);
      return res.status(200).json({ response });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }

  // POST: /users/refresh
  @Refresh()
  @Get('refresh-token')
  async refreshAccessToken(
    @Req() req: ExpressRequestWithUser,
    @Res() res: Response,
  ) {
    try {
      const { jwt_refresh } = req.cookies;

      if (!jwt_refresh) {
        throw new UnauthorizedException('Refresh token not found');
      }

      const result = await this.userService.refreshAccessToken(jwt_refresh);

      if (!result || !result.access_token || !result.refresh_token) {
        throw new UnauthorizedException('Failed to refresh tokens');
      }

      res.cookie('jwt', result.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });

      res.cookie('jwt_refresh', result.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });

      const response = new responseDto('Token refreshed successfully', result);
      return res.status(200).json({ response });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
    }
  }

  // POST: /users/add-user
  @UseGuards(RoleGuard)
  @Role([Roles.ADMIN])
  @Post('add-user')
  async addCmsUser(
    @Body(
      new ValidationPipe({
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    )
    addUser: AddUserDto,
    @Res() res: Response,
  ) {
    const result = await this.userService.addCmsUser(addUser);
    const response = new responseDto('User added successfully', result);
    return res.status(200).json({ response });
  }

  // PATCH: /users/approve/:uuid
  @UseGuards(RoleGuard)
  @Role([Roles.ADMIN])
  @Patch('approve/:uuid')
  async approveCmsUser(@Param('uuid') uuid: string, @Res() res: Response) {
    const result = await this.userService.approveUserRegistration(uuid);
    const response = new responseDto('User approved successfully', result);
    return res.status(200).json({ response });
  }

  // PATCH: /users/update-role/:uuid
  @UseGuards(RoleGuard)
  @Role([Roles.ADMIN])
  @Patch('update-role/:uuid')
  async updateCmsUserRole(
    @Param('uuid') uuid: string,
    @Body(
      new ValidationPipe({
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    )
    updateUser: UpdateAdminDto,
    @Res() res: Response,
  ) {
    const result = await this.userService.updateCmsUserRole(uuid, updateUser);
    const response = new responseDto('User roles updated successfully', result);
    return res.status(200).json({ response });
  }

  // DELETE: /users/:uuid
  @UseGuards(RoleGuard)
  @Role([Roles.ADMIN])
  @Delete(':uuid')
  async deleteUser(@Param('uuid') uuid: string, @Res() res: Response) {
    const result = await this.userService.deleteCmsUser(uuid);
    const response = new responseDto('User deleted successfully', result);
    return res.status(200).json({ response });
  }

  // GET: /users
  @Get('me')
  async getProfile(@Req() req: ExpressRequestWithUser, @Res() res: Response) {
    const user = req.user;
    const result = await this.userService.userInfo(user.sub);
    const response = new responseDto(
      'User profile retrieved successfully',
      result,
    );
    return res.status(200).json({ response });
  }

  // GET: /users/all
  @UseGuards(RoleGuard)
  @Role([Roles.ADMIN])
  @Get('all')
  async getAllCmsUsers(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    )
    query: GetAllUserDto,
    @Res() res: Response,
  ) {
    const result = await this.userService.getAllCmsUsers(query);
    const response = new responseDto(
      'All users retrieved successfully',
      result,
    );
    return res.status(200).json({ response });
  }

  // GET: /users/stats/total
  @UseGuards(RoleGuard)
  @Role([Roles.ADMIN])
  @Get('stats/total')
  async getTotalCmsUsers(@Res() res: Response) {
    const result = await this.userService.countTotalCmsUsers();
    const response = new responseDto(
      'Total users retrieved successfully',
      result,
    );
    return res.status(200).json({ response });
  }

  // GET: /users/stats/totalbyrole
  @UseGuards(RoleGuard)
  @Role([Roles.ADMIN])
  @Get('stats/totalbyrole')
  async getTotalCmsUsersByRole(@Res() res: Response) {
    const result = await this.userService.countTotalCmsUsersByRole();
    const response = new responseDto(
      'Total users by role retrieved successfully',
      result,
    );
    return res.status(200).json({ response });
  }

  // GET: /users/stats/totalbystatus
  @UseGuards(RoleGuard)
  @Role([Roles.ADMIN])
  @Get('stats/totalbystatus')
  async getTotalCmsUsersByStatus(@Res() res: Response) {
    const result = await this.userService.countTotalCmsUsersByStatus();
    const response = new responseDto(
      'Total users by status retrieved successfully',
      result,
    );
    return res.status(200).json({ response });
  }
}
