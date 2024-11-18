import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from "./constants";


export const extractTokenFromHeader = (request: Request): string | undefined => {
  const [type, token] = request.headers.authorization?.split(' ') ?? [];
  return type === 'Bearer' ? token : undefined;
};

// @Injectable()
// export class JwtAuthGuard extends AuthGuard('jwt') {
//   // handleRequest(err, user, info, context) {
//   //   if (err || !user) {
//   //     throw err || new UnauthorizedException();
//   //   }
//   //   // context.user = { ...user }
//   //   return context;
//   // }
// }

export type JwtContent = {
  userId: number,
  username: string
}
export type IReq = Request & { user: JwtContent }

@Injectable()
export class JwtAuthGuard implements CanActivate {
  // logger = new Logger(JwtAuthGuard.name);
  constructor(
    private jwtService: JwtService,
    // private reflector: Reflector,
    // private userService: UserService,
  ) {
    // this.logger.warn('JWTAuthService init');
    // try {
    //   verifyJWTConstants(jwtConstants);
    // } catch (e) {
    //   this.logger.fatal('JWTAuthService init error', e);
    // }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as IReq;
    const token = extractTokenFromHeader(request);
    // const isPublic = this.reflector.getAllAndOverride<PublicProps>(IS_PUBLIC_KEY, [
    //   context.getHandler(),
    //   context.getClass(),
    // ]);
    let payload: JwtContent;

    // if (isPublic) {
    //   if (isPublic.tryDecodeJWT) {
    //     if (token) {
    //       try {
    //         payload = await this.jwtService.verifyAsync<JwtContent>(token, {
    //           secret: jwtConstants.secret,
    //           ignoreExpiration: !isPublic.throwExceptionOnTokenExpiration,
    //         });


    //         request.user = payload;
    //         return true; // token 存在 pass
    //       } catch {
    //         return false; // token 过期 block
    //       }
    //     } else {
    //       request.user = undefined as IReq['user'];
    //       return true; // token 不存在 pass
    //     }
    //   } else {
    //     request.user = undefined as IReq['user'];
    //     return true; // 无条件公开 pass
    //   }
    // }

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      payload = await this.jwtService.verifyAsync<JwtContent>(token, {
        secret: jwtConstants.secret,
      });
      // const rolesReq = this.reflector.getAllAndOverride<Role[]>('roles', [
      //   context.getHandler(),
      //   context.getClass(),
      // ]);

      // // 默认限制 Role.USER 角色
      // if (!payload.roles.some((role) => (rolesReq || ['USER']).includes(role))) {
      //   console.log('默认限制 Role.USER 角色', rolesReq);


      //   throw new UnauthorizedException();
      // }
      request['user'] = payload;
      return true;
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}


