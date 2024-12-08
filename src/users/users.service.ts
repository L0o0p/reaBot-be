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
import { ConfigService } from '@nestjs/config';
import { AuthService } from 'src/auth/auth.service';

export interface CreateUser {
  username: string;
  password: string;
}

export interface CreateBot {
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
  //   inject the Datasource provider
  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
    private authService: AuthService
  ) {
    // get users table repository to interact with the database
    this.userRepository = this.dataSource.getRepository(User);
    this.DIFY_URL = this.configService.get<string>('DIFY_URL');
  }
  // 注册用户
  async register(createUserDto: CreateUser, botId: string, botKey: string) {
    const { username, password } = createUserDto;
    const existUser = await this.findByUsername(username);
    if (existUser) {
      throw new BadRequestException('注册用户已存在');
    }

    const user = {
      ...createUserDto,
      password: encryptPwd(password), // 保存加密后的密码
      bot_id: botId,
      bot_key: botKey
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

  async createBot(CreateBot: CreateBot) {
    const difyUserToken = await this.authService.getCurrentToken()
    const url = `${this.DIFY_URL}/console/api/apps`
    const header = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${difyUserToken}`
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

  async getBotIdByUserId(userId: number) {
    return await this.userRepository.findOne({
      where: { id: userId },
      select: ['bot_id']
    });
  }

  async destroyConversationId(userId: number) {
    await this.userRepository.update({ id: userId }, { conversation_id: null });
    return this.userRepository.findOne({
      where: { id: userId },
    });
  }

  async saveBotKey(botId: string) {
    const difyUserToken = await this.authService.getCurrentToken()
    const url = `${this.DIFY_URL}/console/api/apps/${botId}/api-keys`
    const header = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${difyUserToken}`
    };
    const options = {
      method: 'POST',
      headers: header,
      // body: JSON.stringify(CreateBot)
    };
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error fetching data:', errorData);
        throw new Error('Error fetching data');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

}

// 哈希密码
export const encryptPwd = (password: string) => {
  return bcrypt.hashSync(password, 10);
};
