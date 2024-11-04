import {
  Controller,
  Get,
  Param,
  Body,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LockService } from './lock.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

export interface createLocksDto {
  questionLock: string;
  chatLock: string
}

@UseGuards(JwtAuthGuard)
@Controller('lock')
export class LockController {
  constructor(private readonly appService: LockService) { }

  // 获取所有用户(两个组件)
  @Get()
  async getAllUsers(): Promise<Lock[]> {
    console.log('get');
    return this.appService.getAllLocks();
  }

  // 创建密码
  @Post('create')
  async creatLocks(@Body() createLocksDto: createLocksDto,) {
    console.log('create');
    return this.appService.create(createLocksDto);
  }
  // 更新密码
  @Post('update')
  async updateLocks(@Body() createLocksDto: createLocksDto) {
    return this.appService.updateOrCreate(createLocksDto);
  }

  @Post('questionLock_validate')
  async validateQuestionLock(@Body() questionLock,) {
    console.log('questionLock', questionLock.chatLock);
    return this.appService.validateQuestionLock(questionLock.chatLock);
  }
  @Post('chatLock_validate')
  async validateChatLock(@Body() chatLock,) {
    console.log('chatLock', chatLock.chatLock);
    return this.appService.validateChatLock(chatLock.chatLock);
  }
}