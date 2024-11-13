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
import { User } from './entity/users.entity';
import * as bcrypt from 'bcryptjs';
import { UserProgress } from './entity/user-progress.entity';
import { ConfigService } from '@nestjs/config';

export interface CreateUser {
  username: string;
  password: string;
}

export interface CreateBot{
    name: string,
  icon_type: string,
  icon: string,
  icon_background: string,
  mode: string,
  description: string
}

@Injectable()
export class UsersService {
  private userProgressRepository
  private userRepository;
  private logger = new Logger();
  private DIFY_URL: string
  private difyUserToken: string
  //   inject the Datasource provider
  constructor(
    private dataSource: DataSource,
    private configService: ConfigService
  ) {
    // get users table repository to interact with the database
    this.userProgressRepository = this.dataSource.getRepository(UserProgress);
    this.userRepository = this.dataSource.getRepository(User);
    this.DIFY_URL = this.configService.get<string>('DIFY_URL');
    this.difyUserToken = this.configService.get<string>('DIFY_USER_TOKEN');
  }
  // 注册用户
  async register(createUserDto: CreateUser,botId:string) {
    const { username, password } = createUserDto;
    const existUser = await this.findByUsername(username);
    if (existUser) {
      throw new BadRequestException('注册用户已存在');
    }

    const user = {
      ...createUserDto,
      password: encryptPwd(password), // 保存加密后的密码
      bot_id:botId,
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

  async createUserProgress(user: User): Promise<UserProgress> {
    const newProgress = new UserProgress();
    newProgress.user = user;
    return this.userProgressRepository.save(newProgress);
  }

  async createBot(CreateBot:CreateBot) {
    const url = `${this.DIFY_URL}/console/api/apps`
    const header = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.difyUserToken}`
    };
    const options = {
      method: 'POST',
      headers: header,
      body: JSON.stringify(CreateBot)
    };
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
  }

    async getBotIdByUserId(userId:number) {
    return await this.userRepository.find({
      where: { userId: userId },
      select: ['botId']
    });
  }
}

// 哈希密码
export const encryptPwd = (password) => {
  return bcrypt.hashSync(password, 10);
};
