import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from './users.entity';
import * as bcrypt from 'bcryptjs';


export interface CreateUser {
  username: string;
  password: string;
}

@Injectable()
export class UsersService {
  private userRepository;
  private logger = new Logger();
  //   inject the Datasource provider
  constructor(private dataSource: DataSource) {
    // get users table repository to interact with the database
    this.userRepository = this.dataSource.getRepository(User);
  }
  // 注册用户
  async register(createUserDto: CreateUser) {
    const { username, password } = createUserDto;
    const existUser = await this.findByUsername(username);
    if (existUser) {
      throw new BadRequestException('注册用户已存在');
    }

    const user = {
      ...createUserDto,
      password: encryptPwd(password), // 保存加密后的密码
    };

    return await this.create(user);
  }

  // 创建用户
  async create(user: CreateUser) {
    const { username } = user;
    await this.userRepository.save(user);
    return await this.userRepository.findOne({
      where: { username },
    });
  }

  // 根据用户名搜索
  async findByUsername(username: string): Promise<User | undefined> {
    return await this.userRepository.findOne({ where: { username } });
  }

}

// 哈希密码
export const encryptPwd = (password) => {
  return bcrypt.hashSync(password, 10);
};
