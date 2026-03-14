import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../filters/global.exception/app.exception';
import { ClsService } from 'nestjs-cls';

export enum USER_ROLE {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN',
}

export class UserJWT {
  user_id: string;
  user_email: string;
  user_role: USER_ROLE;
  iat: number;
  exp: number;
}
export interface RequestWithUser extends Request {
  user: UserJWT;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cls: ClsService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new AppException(
        'Unauthorized (Token Not Found)',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync<UserJWT>(token, {
        secret: this.configService.get<string>('SECRET', { infer: true }),
      });
      this.cls.set('access_token', `Bearer ${token}`);
      request.user = payload;
    } catch {
      throw new AppException(
        'Unauthorized (Token Invalid)',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;

    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
