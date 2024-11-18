import { Body, Controller, Get, Param, Post, UseGuards, Req, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { askForTips, information } from './dify.dto';
import { DifyService } from './dify.service';
import { Dify } from './dify.entity';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { ArticleService } from 'src/article/article.service';
import { UsersService } from 'src/users/users.service';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class DifyController {
  constructor(
    private readonly appService: DifyService,
    private readonly articleService: ArticleService,
    private readonly userService: UsersService,
  ) {
    // const current_database_id = this.appService.getCurrentDatabaseId();
  }

  @Get('test')
  async test(
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      }
    }
  ) {
    const botId = await this.appService.getBotIdByUserId(req.user.userId)
    return {
      botId: botId,
      user:req.user
      }
    }
  // 发送聊天消息
  @Post('/send')
  async sendInformation(
    @Body() info: information,
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      }
    }
  ) {
    // console.log("reqds",req.user.user);
    console.log('req.user.user',req.user.userId);
    
    return await this.appService.sendInfo(info, req.user);
  }
  // 发送聊天消息（使用questions的tips提问）
  @Post('/gettips')
  async sendPromptInformation(
    @Body() info: askForTips,
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      }
    }
  ) {
    const library_id = await this.appService.fetchBotLibraryId( req.user)
    const title = (await this.appService.getArticleName(library_id,req.user.userId)).title+'.docx'
    console.log('title',title);
    // info = "question"+"tips"
    const articleQuestions: string[] = await this.articleService.getDocumentByNameAndTag(title, 'questions')
    const questions = articleQuestions[info.questionIndex]
    const mixInfo = { information: "对于这篇文章，有以下这道阅读理解题，请问" + info.tip + ":" + questions }
    console.log(mixInfo);
    return await this.appService.sendInfo(mixInfo, req.user);
  }
  // 从本地获取机器人正在使用的知识库对应的文章
  @Get('/articleUsedByBot')
  async getBottest(
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      }
    }
  ) {
    const library_id = await this.appService.fetchBotLibraryId(req.user)
    console.log('library_id', library_id);
    return this.appService.getArticleName(library_id,req.user.userId)
    //预期返回：{"title":"节日快乐","library_id":"15e4c247-aa06-41c9-b4a2-25e49e977af5"}
  }
  // 获取机器人信息
  @Get('/bot-info')
  async fetchBotInfo(
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      }
    }
  ) {
    console.log('req.user.userId',req.user.userId);
    const bot_id = await this.appService.getBotIdByUserId(req.user.userId)
    console.log('bot_id',bot_id);
    const bot_info = await this.appService.fetchBotInfo(bot_id)
    //知识库id
    const libraryId = bot_info.model_config.dataset_configs.datasets.datasets[0].dataset.id
    console.log("log", libraryId);
    const state = { "知识库id": libraryId }
    return { state, bot_info }
  }

  //修改机器人使用的知识库
  // @Get('/change_library/:library_id')
  // @HttpCode(HttpStatus.OK) // 明确设置 HTTP 状态码为 200
  // async changeSourceLibrary(
  //   @Param('library_id') libraryId: string,
  //   @Req() req: {
  //   user: {
  //     user: {
  //       userId: number;
  //       token: string;
  //     }
  //   }
  // }
  // ) {
  //   const botId = await this.userService.getBotIdByUserId(req.user.userId);
  //   // const botId = 'a2ff7b15-cfc4-489d-96cf-307d33c43b00';
  //   // 销毁conversation_id以便他能根据新的知识库创建一个新的对话
  //   await this.userService.destroyConversationId(req.user.userId);
    
  //   try {
  //     const result = await this.appService.changeSourceLibrary(botId, libraryId);
  //     return result;
  //   } catch (error) {
  //     throw new HttpException('Failed to change the library', HttpStatus.INTERNAL_SERVER_ERROR);
  //   }
  // }

  //修改机器人使用的知识库(使用标题)
  @Get('/change_libraryBytitle/:title')
  @HttpCode(HttpStatus.OK) // 明确设置 HTTP 状态码为 200
  async changeSourceLibraryByTittle(
    @Param('title') title: string,
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      }
    }
  ) {
    const libraryId = (await this.articleService.getArticleByTitle(title)).library_id;
    const botId = (await this.userService.getBotIdByUserId(req.user.userId)).bot_id;
    // 销毁conversation_id以便他能根据新的知识库创建一个新的对话
    await this.userService.destroyConversationId(req.user.userId);
    console.log('libraryId',libraryId);
    console.log('botId',botId);
    
    // const botId = 'a2ff7b15-cfc4-489d-96cf-307d33c43b00';
    try {
      const result = await this.appService.changeSourceLibrary(botId, libraryId);
      return result;
    } catch (error) {
      throw new HttpException('Failed to change the library', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 获取聊天记录
  @Get('/chatlog')
  async getChatlog(@Req() req: {
      user: {
        user: {
          id: number;
          userId: number;
          username: string;
        }
      }
    }) {
    return this.appService.getChatlog(req.user.user);
  }

  // 创建新的coversation
  @Get('new_conversation')
  async newConversation() {
    return await this.appService.newConversation();
  }
  
}