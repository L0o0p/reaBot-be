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
  // 发送聊天消息
  @Post('/send')
  async sendInformation(@Body() info: information, @Req() req: any & { user: { id: number, username: string } }) {
    // console.log("reqds",req.user.user);
    return await this.appService.sendInfo(info, req.user.user);
  }
  // 发送聊天消息（使用questions的tips提问）
  @Post('/gettips')
  async sendPromptInformation(@Body() info: askForTips, @Req() req: any & { user: { id: number, username: string } }) {
    const library_id = await this.appService.fetchBotLibraryId()
    const title = (await this.appService.getArticleName(library_id)).title+'.docx'
    console.log('title',title);
    // info = "question"+"tips"
    const articleQuestions: string[] = await this.articleService.getDocumentByNameAndTag(title, 'questions')
    const questions = articleQuestions[info.questionIndex]
    const mixInfo = { information: "对于这篇文章，有以下这道阅读理解题，请问" + info.tip + ":" + questions }
    console.log(mixInfo);
    return await this.appService.sendInfo(mixInfo, req.user.user);
  }
  // 从本地获取机器人正在使用的知识库对应的文章
  @Get('/articleUsedByBot')
  async getBottest() {
    const library_id = await this.appService.fetchBotLibraryId()
    console.log('library_id', library_id);
    return this.appService.getArticleName(library_id)
    //预期返回：{"title":"节日快乐","library_id":"15e4c247-aa06-41c9-b4a2-25e49e977af5"}
  }
  // 获取机器人信息
  @Get('/bot-info')
  async fetchBotInfo() {
    const bot_info = await this.appService.fetchBotInfo()
    //知识库id
    const libraryId = bot_info.model_config.dataset_configs.datasets.datasets[0].dataset.id
    console.log("log", libraryId);
    const state = { "知识库id": libraryId }
    return { state, bot_info }
  }

  //修改机器人使用的知识库
  @Get('/change_library/:library_id')
  @HttpCode(HttpStatus.OK) // 明确设置 HTTP 状态码为 200
  async changeSourceLibrary(@Param('library_id') libraryId: string, @Req() req: any & { user: { id: number, username: string } }) {
    const botId = await this.userService.getBotIdByUserId(req.user.id);
    // const botId = 'a2ff7b15-cfc4-489d-96cf-307d33c43b00';
    try {
      const result = await this.appService.changeSourceLibrary(botId, libraryId);
      return result;
    } catch (error) {
      throw new HttpException('Failed to change the library', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  //修改机器人使用的知识库(使用标题)
  @Get('/change_libraryBytitle/:title')
  @HttpCode(HttpStatus.OK) // 明确设置 HTTP 状态码为 200
  async changeSourceLibraryByTittle(@Param('title') title: string) {
    const libraryId = (await this.articleService.getArticleByTitle(title)).library_id;
    const botId = 'a2ff7b15-cfc4-489d-96cf-307d33c43b00';
    try {
      const result = await this.appService.changeSourceLibrary(botId, libraryId);
      return result;
    } catch (error) {
      throw new HttpException('Failed to change the library', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 获取聊天记录
  @Get('/chatlog')
  async getChatlog(@Req() req: any & { user: { id: number, username: string } }) {
    return this.appService.getChatlog(req.user.user);
  }

}