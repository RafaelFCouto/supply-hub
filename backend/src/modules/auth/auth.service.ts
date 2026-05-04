import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sign, SignOptions } from 'jsonwebtoken';
import { comparePassword } from 'src/common/utils/password.util';
import { UsersRepository } from '../users/users.repository';
import { LoginDto } from './dto/login.dto';
import { AuthUser } from './interfaces/auth-user.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginResponse } from './interfaces/login-response.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.usersRepository.findByEmail(loginDto.email);

    if (!user || !comparePassword(loginDto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User is not active');
    }

    const authUser: AuthUser = {
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      roleIds: user.userRoles.map((userRole) => userRole.roleId),
    };

    const payload: JwtPayload = {
      sub: authUser.id,
      email: authUser.email,
      tenantId: authUser.tenantId,
      roleIds: authUser.roleIds,
    };

    const jwtOptions: SignOptions = {
      issuer: this.configService.getOrThrow<string>('JWT_ISSUER'),
      audience: this.configService.getOrThrow<string>('JWT_AUDIENCE'),
      expiresIn: this.configService.getOrThrow<string>('JWT_EXPIRES_IN') as SignOptions['expiresIn'],
    };

    const accessToken = sign(payload, this.configService.getOrThrow<string>('JWT_SECRET'), jwtOptions);

    return {
      data: {
        accessToken,
      },
      message: 'Login completed successfully',
    };
  }
}
