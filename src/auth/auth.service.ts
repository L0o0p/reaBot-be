import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { User } from 'src/users/entity/users.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs/operators';
import axios from 'axios';
const fs = require('fs');
const path = require('path');
export interface LoginUserDto {
  username: string;
  password: string;
}

@Injectable()
export class AuthService {
  private userRepository: Repository<User>;
  private logger = new Logger();
  private DIFY_USER_USRN: string
  private DIFY_USER_PSWD: string
  private DIFY_URL: string
  private readonly CONFIG_FILE_PATH = '/Users/loopshen/Downloads/be/reaBot-be/dify_user_token_config.json';
  constructor(
    private dataSource: DataSource,
    private readonly jwtService: JwtService,
    private configService: ConfigService,
    private httpService: HttpService
  ) {
    this.userRepository = this.dataSource.getRepository(User);
    this.DIFY_USER_USRN = this.configService.get<string>('DIFY_USER_USRN');
    this.DIFY_USER_PSWD = this.configService.get<string>('DIFY_USER_PSWD');
    this.DIFY_URL = this.configService.get<string>('DIFY_URL');
  }
  // 登录功能
  async login(loginUserDto: LoginUserDto) {
    const existUser = await this.validateUser(loginUserDto); // 验证信息（传入
    const token = this.createToken(existUser);// 创建token（如果通过验证）
    return {
      userId: existUser.id,
      token,
    };
  }
  /**
   * 校验登录用户
   * @param user
   * @returns
   */
  async validateUser(user: LoginUserDto) {
    const { username, password } = user;
    const existUser = await this.findByUsername(username);
    if (!existUser) {
      throw new BadRequestException('用户不存在');
    }
    const { password: encryptPwd } = existUser;
    const isOk = comparePwd(password, encryptPwd);
    if (!isOk) {
      throw new BadRequestException('登录密码错误');
    }
    return existUser;
  }

  async findByUsername(username: string): Promise<User | undefined> {
    return await this.userRepository.findOne({ where: { username } });
  }

  /**
   * 创建token
   * @param user
   * @returns
   */
  createToken(user: User) {
    const payload = {
      id: user.id,
      userId: user.id,
      username: user.username,
    };
    try {
      return this.jwtService.sign(payload, { secret: jwtConstants.secret });//后面这个一定要带上才能鉴定成功
    } catch (error) {
      console.error('Error generating token:', error);
      throw new Error('Error generating token');
    }
  }

  // 查询所有用户信息
  async getAllUsers(): Promise<User[]> {
    try {
      const users = await this.userRepository.find();
      return users;
    } catch (err) {
      this.logger.error(err.message, err.stack);
      throw new InternalServerErrorException('Failed to retrieve users');
    }
  }
  // 查询指定用户信息
  async getUserById(id: number): Promise<User> {
    try {
      const user = await this.userRepository.findOneBy({ id });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user;
    } catch (err) {
      this.logger.error(
        `Failed to find user by ID ${id}: ${err.message}`,
        err.stack,
      );
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException(
        'Something went wrong, Try again!',
      );
    }
  }
  // 删除指定用户信息
  async deleteUser(userDetails: User): Promise<void> {
    try {
      const user = await this.userRepository.findOneBy({
        username: userDetails.username,
      });
      if (!user) {
        throw new NotFoundException(
          `User with username '${userDetails.username}' not found`,
        );
      }
      await this.userRepository.remove(user);
    } catch (err) {
      this.logger.error(`Failed to delete user: ${err.message}`, err.stack);
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException(
        'Failed to delete user, try again!',
      );
    }
  }

  // 在构造函数或初始化方法中添加
  private initializeConfigDirectory() {
    if (!fs.existsSync(this.CONFIG_FILE_PATH)) {
      fs.mkdirSync(this.CONFIG_FILE_PATH, { recursive: true });
      console.log('Created config directory at:', this.CONFIG_FILE_PATH);
    }
  }

  // 用于创建dify的token
  async loginAndGetTokens(): Promise<any> {
    console.log('自动获取token');
    try {
      this.initializeConfigDirectory();
      const url = `${this.DIFY_URL}/console/api/login`;
      const body = {
        email: this.DIFY_USER_USRN,
        password: this.DIFY_USER_PSWD,
        language: "zh-Hans",
        remember_me: true
      };

      const headers = {
        'Content-Type': 'application/json',
      };

      const response = await this.httpService.post(url, body, { headers })
        .pipe(
          map(response => {
            console.log('API response:', response.data);
            return {
              accessToken: response.data.data.access_token,
              refreshToken: response.data.data.refresh_token,
              expiresIn: response.data.data.expires_in || 3600
            };
          })
        )
        .toPromise();

      // 保存tokens
      process.env.ACCESS_TOKEN = response.accessToken;
      process.env.REFRESH_TOKEN = response.refreshToken;

      // 保存配置文件，并打印保存位置
      const config = {
        ACCESS_TOKEN: response.accessToken,
        REFRESH_TOKEN: response.refreshToken,
        EXPIRES: Date.now() + (response.expiresIn * 1000)
      };
      fs.writeFileSync(this.CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
      console.log('Config file saved at:', this.CONFIG_FILE_PATH);

      // 设置自动重新登录
      // 在token过期前10分钟重新登录
      const reloginTime = (response.expiresIn - 600) * 1000;
      setTimeout(() => this.loginAndGetTokens(), reloginTime);

      return response;
    } catch (error) {
      console.error('Login Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  // 获取当前token的辅助方法
  async getCurrentToken(): Promise<string> {
    try {
      // 检查配置文件
      const configPath = path.join(__dirname, '.runtime-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        // 如果token即将过期（小于5分钟），重新登录
        if (config.EXPIRES - Date.now() < 300000) {
          const newTokens = await this.loginAndGetTokens();
          return newTokens.accessToken;
        }

        return config.ACCESS_TOKEN;
      }

      // 如果没有配置文件，执行登录
      const tokens = await this.loginAndGetTokens();
      return tokens.accessToken;
    } catch (error) {
      console.error('Get Current Token Error:', error);
      throw error;
    }
  }

  //弃用的refresh Token方法 
  // async refreshToken(refreshToken: string, accessToken:string) {
  //   const TOKEN_ENDPOINT = `${this.DIFY_URL}/console/api/refresh-token`;
  //   try {
  //     // 先获取当前的access token
  //     const currentAccessToken = process.env.ACCESS_TOKEN;

  //     const response = await axios.post(TOKEN_ENDPOINT,
  //       {
  //         refresh_token: refreshToken
  //       },
  //       {
  //         headers: {
  //           'Content-Type': 'application/json',
  //           'Accept': 'application/json',
  //           'Authorization': `Bearer ${currentAccessToken}`,  // 使用当前的access token
  //           'X-Api-Key': accessToken  // 添加API Key作为额外的header
  //         }
  //       });

  //     console.log('Refresh Response:', response.data);

  //     const { access_token, expires_in } = response.data;

  //     process.env.ACCESS_TOKEN = access_token;

  //     fs.writeFileSync(path.join(__dirname, '.runtime-config.json'), JSON.stringify({
  //       ACCESS_TOKEN: access_token,
  //       REFRESH_TOKEN: refreshToken,
  //       EXPIRES: Date.now() + expires_in * 1000
  //     }));

  //     setTimeout(() => this.refreshToken(refreshToken, accessToken), (expires_in - 300) * 1000);

  //     return access_token;
  //   } catch (error) {
  //     console.error('Refresh Token Error:', {
  //       url: TOKEN_ENDPOINT,
  //       currentAccessToken: process.env.ACCESS_TOKEN?.substring(0, 10) + '...',
  //       refreshToken: refreshToken?.substring(0, 10) + '...',
  //       apiKey: accessToken ? 'Set' : 'Not Set',
  //       status: error.response?.status,
  //       statusText: error.response?.statusText,
  //       data: error.response?.data,
  //       headers: error.response?.headers
  //     });
  //     throw error;
  //   }
  // }
}
/**
 * 比较明文密码和加密密码是否匹配
 */
function comparePwd(password: string, hashPwd: string): boolean {
  if (!password || !hashPwd) {
    console.error(
      `Invalid arguments passed to comparePwd: password=${password}, encryptPwd=${hashPwd}`,
    );
    return false;
  }
  // 示例：使用bcrypt进行密码比较
  // console.log('password', password, 'encryptPwd', hashPwd);
  // console.log(password === encryptPwd);
  return bcrypt.compareSync(password, hashPwd);
  // return password === encryptPwd;
}
