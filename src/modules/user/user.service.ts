import {
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { Roles, UserStatus } from 'generated/prisma/enums';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { AddUserDto } from './dto/add-user.dto';
import { GetAllUserDto } from './dto/get-all-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateAdminDto } from './dto/update-user.dto';
import { UserPayload } from './interfaces/login-user';

@Injectable()
export class UserService {
  constructor(
    private readonly db: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registerUser(registerUser: RegisterUserDto) {
    try {
      const checkUser = await this.db.user.findUnique({
        where: {
          email: registerUser.email,
          NOT: {
            status: UserStatus.DELETED,
          },
        },
      });

      if (checkUser) {
        throw new ConflictException('Email already exists');
      }

      if (registerUser.password !== registerUser.confirm_password) {
        throw new ConflictException(
          'Password and confirm password do not match',
        );
      }

      const newUser = await this.db.user.create({
        data: {
          email: registerUser.email,
          full_name: registerUser.full_name,
          password: await hash(registerUser.password, 12),
          status: UserStatus.REQUEST,
          roles: undefined,
        },
      });

      const { password, uuid, ...userWithoutSensitiveData } = newUser;

      return userWithoutSensitiveData;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }

  async loginUser(loginUser: LoginUserDto) {
    try {
      const user = await this.db.user.findUnique({
        where: {
          email: loginUser.email,
        },
      });

      if (!user || user.status === UserStatus.DELETED) {
        throw new NotFoundException('User not found');
      }

      if (user.status === UserStatus.REQUEST) {
        throw new UnauthorizedException(
          'User registration is pending approval',
        );
      }

      if (!(await compare(loginUser.password, user.password))) {
        throw new UnauthorizedException('Email or password is incorrect');
      }

      const uniqueUUID = uuidv4();

      const payload: UserPayload = {
        sub: user.uuid,
        uniqueUUID: uniqueUUID,
        date: new Date(),
        role: user.roles,
      };

      await this.db.user.update({
        where: {
          uuid: user.uuid,
        },
        data: {
          session_token: uniqueUUID,
        },
      });

      const tokens = {
        access_token: await this.jwtService.signAsync(payload, {
          expiresIn: '12h',
        }),
        refresh_token: await this.jwtService.signAsync(payload, {
          expiresIn: '7d',
        }),
        payload,
      };
      return tokens;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);

      const user = await this.db.user.findUnique({
        where: {
          uuid: payload.sub,
        },
      });

      if (!user || user.session_token !== payload.uniqueUUID) {
        throw new UnauthorizedException('Invalid session token');
      }

      const newPayload: UserPayload = {
        sub: payload.sub,
        uniqueUUID: uuidv4(),
        date: new Date(),
        role: payload.role,
      };

      await this.db.user.update({
        where: { uuid: payload.sub },
        data: { session_token: newPayload.uniqueUUID },
      });

      const tokens = {
        access_token: await this.jwtService.signAsync(newPayload, {
          expiresIn: '12h',
        }),
        refresh_token: await this.jwtService.signAsync(newPayload, {
          expiresIn: '7d',
        }),
        payload: newPayload,
      };
      return tokens;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }

  async addCmsUser(addUser: AddUserDto) {
    try {
      const existingUser = await this.db.user.findFirst({
        where: {
          email: addUser.email,
          NOT: {
            status: UserStatus.DELETED,
          },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      const newUser = await this.db.user.create({
        data: {
          email: addUser.email,
          full_name: addUser.full_name,
          password: await hash(addUser.password, 12),
          status: UserStatus.ACTIVE,
          roles: addUser.roles,
        },
      });

      const { password, uuid, ...userWithoutSensitiveData } = newUser;

      return userWithoutSensitiveData;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }

  async approveUserRegistration(uuid: string) {
    try {
      const user = await this.db.user.findUniqueOrThrow({
        where: {
          uuid: uuid,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.status === UserStatus.ACTIVE) {
        throw new ConflictException('User is already active');
      }

      const approvedUser = await this.db.user.update({
        where: {
          uuid: uuid,
        },
        data: {
          status: UserStatus.ACTIVE,
          roles: undefined,
        },
      });

      const { password, ...userWithoutSensitiveData } = approvedUser;

      return userWithoutSensitiveData;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }

  async updateCmsUserRole(uuid: string, updateUserDto: UpdateAdminDto) {
    try {
      const user = await this.db.user.findUniqueOrThrow({
        where: {
          uuid: uuid,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Create a Set to automatically remove duplicates
      // const updatedRoles = [
      //   ...new Set([...user.roles, ...updateUserDto.roles]),
      // ];

      const updatedRoles = [...updateUserDto.roles];

      // if (!updatedRoles.includes(Roles.USER)) {
      //   updatedRoles.push(Roles.USER);
      // }

      const updateUserBySuperAdmin = await this.db.user.update({
        where: {
          uuid: uuid,
        },
        data: {
          roles: updatedRoles,
        },
      });

      const { password, ...userWithoutSensitiveData } = updateUserBySuperAdmin;

      return userWithoutSensitiveData;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }

  async deleteCmsUser(uuid: string) {
    try {
      const user = await this.db.user.findUnique({
        where: {
          uuid: uuid,
          AND: {
            status: {
              in: [UserStatus.ACTIVE, UserStatus.REQUEST],
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.db.$transaction(async (tx) => {
        const deletedUser = await tx.user.update({
          where: {
            uuid,
          },
          data: {
            status: UserStatus.DELETED,
            deleted_at: new Date(),
            email: `${user.email}_DELETED`,
            session_token: null,
          },
        });

        return deletedUser;
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }

  async userInfo(uuid: string) {
    try {
      const user = await this.db.user.findUnique({
        where: {
          uuid: uuid,
        },
        omit: {
          password: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }

  async getAllCmsUsers(getAllUser: GetAllUserDto) {
    try {
      const page = getAllUser?.page ?? 1;
      const limit = getAllUser?.limit ?? 10;
      const cmsUsers = await this.db.user.findMany({
        where: {
          status: {
            in: [UserStatus.ACTIVE, UserStatus.REQUEST],
          },
          ...(getAllUser.search
            ? {
                OR: [
                  {
                    email: {
                      contains: getAllUser.search,
                      mode: 'insensitive',
                    },
                  },
                  {
                    full_name: {
                      contains: getAllUser.search,
                      mode: 'insensitive',
                    },
                  },
                ],
              }
            : {}),
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          uuid: true,
          email: true,
          full_name: true,
          roles: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      });
      return cmsUsers;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }

  async countTotalCmsUsers() {
    try {
      const totalCmsUsers = await this.db.user.count({
        where: {
          status: {
            in: [UserStatus.ACTIVE, UserStatus.REQUEST],
          },
        },
      });
      return totalCmsUsers;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }

  async countTotalCmsUsersByRole() {
    try {
      const newsAdmin = await this.db.user.count({
        where: {
          status: UserStatus.ACTIVE,
          roles: {
            has: Roles.NEWS_EDITOR,
          },
        },
      });

      const adsAdmin = await this.db.user.count({
        where: {
          status: UserStatus.ACTIVE,
          roles: {
            has: Roles.ADS_EDITOR,
          },
        },
      });

      const totalCmsUsersByRole = [
        {
          role: Roles.NEWS_EDITOR,
          count: newsAdmin,
        },
        {
          role: Roles.ADS_EDITOR,
          count: adsAdmin,
        },
      ];

      return totalCmsUsersByRole;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }

  async countTotalCmsUsersByStatus() {
    try {
      const activeUsers = await this.db.user.count({
        where: {
          status: UserStatus.ACTIVE,
        },
      });

      const requestUsers = await this.db.user.count({
        where: {
          status: UserStatus.REQUEST,
        },
      });

      const totalCmsUsersByStatus = [
        {
          status: UserStatus.ACTIVE,
          count: activeUsers,
        },
        {
          status: UserStatus.REQUEST,
          count: requestUsers,
        },
      ];

      return totalCmsUsersByStatus;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }
}
