import {
  Controller,
  Get,
  Param,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { User } from 'src/users/entity/users.entity';
import { AuthService, LoginUserDto } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: AuthService) { }

  @Get('getCurrentToken')
  async getCurrentToken() {
    return await this.usersService.getCurrentToken();
  }

  @Post('getToken')
  async getToken() {
    try {
      const tokens = await this.usersService.loginAndGetTokens();
      console.log('XX',tokens);  // 这里会显示 accessToken, refreshToken 和 expiresIn
      const refreshToken = tokens.refreshToken
      const accessToken = tokens.accessToken
      return { accessToken };
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  // 获取所有用户
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllUsers(): Promise<User[]> {
    return this.usersService.getAllUsers();
  }

  // // 根据 ID 获取用户
  // @UseGuards(JwtAuthGuard)
  // @Get(':id')
  // async getUserById(@Param('id') id: number): Promise<User> {
  //   return this.usersService.getUserById(id);
  // }

  // 删除用户
  @UseGuards(JwtAuthGuard)
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT) // 设置成功删除时返回的 HTTP 状态码为 204
  async deleteUser(@Body() userDetails: User): Promise<void> {
    await this.usersService.deleteUser(userDetails);
  }
  // 用户登录
  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto,) {
    return this.usersService.login(loginUserDto);
  }
}