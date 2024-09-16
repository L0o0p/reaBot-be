import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { jwtConstants } from './constants'; 
import { JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

const jwtModule = JwtModule.registerAsync({
  imports: [ConfigModule], // 确保 ConfigModule 被导入
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    return {
      secret: configService.get(jwtConstants.secret),
      signOptions: { expiresIn: '4h' }, // 设置token过期时间
    };
  },
});
@Module({
  imports: [ConfigModule, jwtModule, UsersModule, PassportModule],
  controllers: [AuthController],
  providers: [AuthService,JwtStrategy ],
  exports: [AuthService, jwtModule], // 确保 AuthService 被导出

})
export class AuthModule {}
