import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IReqUser, Role } from 'src/base.entity';
import { ROLES_KEY } from './role.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const req = context.switchToHttp().getRequest();
    const user: IReqUser = req?.user ? req.user : {};

    const isAllowed = requiredRoles.some((role) => user?.role === role);

    if (!isAllowed) {
      throw new HttpException('Not Authorized', HttpStatus.UNAUTHORIZED);
    }

    return isAllowed;
  }
}
