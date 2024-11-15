
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';

/**
 * 实现jwt策略
 * 对于 JWT 策略，Passport 首先验证 JWT 的签名并解码 JSON 。然后调用我们的 validate() 方法，该方法将解码后的 JSON 作为其单个参数传递
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      // 提供从请求中提取 JWT 的方法。
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 选择默认的 false 设置，它将确保 JWT 没有过期的责任委托给 Passport 模块。这意味着，如果我们的路由提供了一个过期的 JWT ，请求将被拒绝，并发送 401 Unauthorized 的响应。
      ignoreExpiration: false,
      // 密钥，不要暴露出去
      secretOrKey: jwtConstants.secret,
      //   secretOrKey: jwtConstants.secret,
    } as StrategyOptions);
  }

  async validate(payload: any) {
    return { userId: payload.id, username: payload.username };
  }
}