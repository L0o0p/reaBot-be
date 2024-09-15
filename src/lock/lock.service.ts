import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createLocksDto } from './lock.controller';
import { Component_lock } from './lock.entity';


@Injectable()
export class LockService {
  private locksRepository;
  private logger = new Logger();
  // 在authService类构造函数中注入JwtService
  constructor(
    private dataSource: DataSource,
  ) {
    this.locksRepository = this.dataSource.getRepository(Component_lock);
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
      throw new Error('the Component_lock code not found');
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
    let feedback = "验证码正确！";
    const existUser = await this.locksRepository.findOne({ where: { questionLock } });
    console.log('existUser', existUser);

    if (!existUser) {
      feedback = "密码不正确"
      // throw new BadRequestException(feedback);
    }
    return feedback;
  }

  async validateChatLock(chatLock: string) {
    let feedback = "验证码正确！";
    const existUser = await this.locksRepository.findOne({ where: { chatLock } });
    console.log('existUser', existUser);

    if (!existUser) {
      feedback = "密码不正确"
      // throw new BadRequestException(feedback);
    }
    return feedback;
  }

  // 根据用户名搜索
  async findByUsername(questionLock: string) {
    return await this.locksRepository.findOne({ where: { questionLock } });
  }
}

