import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserJWT } from '../../guards/auth/auth.guard';

export const User = createParamDecorator(
  (data: keyof UserJWT | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: UserJWT }>();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
