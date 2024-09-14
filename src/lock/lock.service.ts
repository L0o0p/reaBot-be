import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createLocksDto } from './lock.controller';
import { Lock } from './lock.entity';


@Injectable()
export class LockService {
  private locksRepository;
  private logger = new Logger();
  // 在authService类构造函数中注入JwtService
  constructor(
    private dataSource: DataSource,
  ) {
    this.locksRepository = this.dataSource.getRepository(Lock);
  }
  // 创建密码组
  async create(locks: createLocksDto) {
    console.log('create', locks);
    const { questionLock } = locks;
    await this.locksRepository.save(locks);
    return await this.locksRepository.findOne({
      where: { questionLock },
    });
  }
  // 更新密码组
  async update(createLocksDto: createLocksDto) {
    const { questionLock, chatLock } = createLocksDto;
    const id = 1
    const existLocks = await this.locksRepository.findOne({ where: { id } })
    if (!existLocks) {
      throw new Error('User not found');
    }
    existLocks.questionLock = questionLock;
    existLocks.chatLock = chatLock;
    console.log('修改成功，新的密码组：', existLocks);
    return this.locksRepository.save(existLocks);
  }

  // 查询所有密码组
  async getAllLocks(): Promise<Lock[]> {
    try {
      const locks = await this.locksRepository.find();
      return locks;
    } catch (err) {
      this.logger.error(err.message, err.stack);
      throw new InternalServerErrorException('Failed to retrieve users');
    }
  }
  /**
 * 校验
 * @param user
 * @returns
 */
  async validateQuestionLock(questionLock: string) {
    const existUser = await this.locksRepository.findOne({ where: { questionLock } });
    if (!existUser) {
      throw new BadRequestException('密码不正确');
    }
    const s = '验证通过'
    return s;
  }

  async validateChatLock(chatLock: string) {
    console.log('chuarn', chatLock);

    const existUser = await this.locksRepository.findOne({ where: { chatLock } });
    if (!existUser) {
      throw new BadRequestException('密码不正确');
    }
    const s = '验证通过'
    return s;
  }

  // 根据用户名搜索
  async findByUsername(questionLock: string) {
    return await this.locksRepository.findOne({ where: { questionLock } });
  }
}

