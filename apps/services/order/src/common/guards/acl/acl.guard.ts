import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestWithUser, USER_ROLE } from '../auth/auth.guard';
import { AppException } from '../../filters/global.exception/app.exception';

@Injectable()
export class AclGuard implements CanActivate {
  constructor(private readonly roleCanAccess: USER_ROLE[]) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userRole = request.user.user_role;

    if (!this.roleCanAccess.includes(userRole)) {
      throw new AppException(
        `Access denied because your role is ${userRole}`,
        HttpStatus.UNAUTHORIZED,
      );
    }

    return true;
  }
}
