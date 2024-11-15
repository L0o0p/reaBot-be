import { Body, Controller, Get, Post, Req, Request, UseGuards } from '@nestjs/common';
import { CreateUser, UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { DifyService } from 'src/chat/dify.service';
import { AnswerSheet } from 'src/answer-sheet/entities/answer-sheet.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AnswerSheetService } from 'src/answer-sheet/answer-sheet.service';
import { ArticleService } from 'src/article/article.service';
import { PaperService } from 'src/article/paper.service';

export interface CreateBot {
  name: string,
  icon_type: string,
  icon: string,
  icon_background: string,
  mode: string,
  description: string
}


@Controller('users')
export class UsersController {
  constructor(
    private userService: UsersService,
    private chatService: DifyService,
    private articleService: ArticleService,
    private paperService: PaperService,
    private answerSheetService: AnswerSheetService,

  ) { }

  @Get('lateAnswerSheet')
    async findLatestAnswerSheet(): Promise<AnswerSheet | undefined> {
    const userId: number = 1
    return await this.answerSheetService.findLatestAnswerSheet(userId)
  }

  @Post('create')
  //   handles the post request to /users/create endpoint to create new user
  async signUp(@Body() user: CreateUser) {
    // 创建新的机器人
    const botSettings:CreateBot = {
      name: user.username,
      icon_type: "emoji",
      icon: "smiley",
      icon_background: "#FCE7F6",
      mode: "chat",
      description: "read_bot"
    }
    const newBot = await this.userService.createBot(botSettings)
    // 获取并且存储机器人的key
    const botKey = (await this.userService.saveBotKey(newBot.id)).token
    // 注册用户
    const newUser = await this.userService.register(user, newBot.id,botKey);
    const newUser_id = newUser.id;
    // 给用户创建一个进度
    const paperId = await this.paperService.getPaperWithSmallestId()
    await this.answerSheetService.CreateAnswerSheet(paperId, newUser_id)
    const libraryId = await this.paperService.findLibraryIdByPaperId(paperId)
    // 最新的答题卡（进度）=> 对应paperId.articleA => libraryId => changeSourceLibrary(newBot_id, libraryId)
    const result = await this.chatService.changeSourceLibrary(newBot.id, libraryId);
    // 创建新的进度记录，链接到新注册的用户
    // const newProgress = await this.userService.createUserProgress(newUser);
    return newUser
  }
    @Get('test')
  //   handles the post request to /users/create endpoint to create new user
    async test() {
      return await this.paperService.findNextMinId(2)
  }


  @UseGuards(JwtAuthGuard)
  @Get('profile')
  //   handles the post request to /users/create endpoint to create new user
  async gerProfile(@Req() req: {
      user: {
        user: {
          id: number;
          userId: number;
          username: string;
        }
      }
    }) {
    console.log(req.user.user);
    return await this.userService.findByUsername(req.user.user.username);
  }

  @Post('createBot')
  //   handles the post request to /users/create endpoint to create new user
  async createBot(@Body() botSettings: CreateBot) {
    // 创建新的进度记录，链接到新注册的用户
    return await this.userService.createBot(botSettings)
  }

  
}

