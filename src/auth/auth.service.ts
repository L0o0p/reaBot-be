import {
  Injectable,
  Logger,
  NotFoundException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { User } from 'src/users/entity/users.entity';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';

export interface LoginUserDto {
  username: string;
  password: string;
}

@Injectable()
export class AuthService {
  private userRepository;
  private logger = new Logger();
  // 在authService类构造函数中注入JwtService
  constructor(
    private dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {
    this.userRepository = this.dataSource.getRepository(User);
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
  createToken(user) {
    const payload = {
      id: user.id,
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
