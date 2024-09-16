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
import { Component_lock } from './lock.entity';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

export interface createLocksDto {
  questionLock: string;
  chatLock: string
}

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
  @UseGuards(JwtAuthGuard)
  @Post('update')
  async updateLocks(@Body() createLocksDto: createLocksDto, @Req() req: any & { user: { anim_permission: boolean } }) {
    if (!req.user.anim_permission) {
      const feedback = '你没有权限进行该操作'
      return feedback
    }
    return this.appService.update(createLocksDto);
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