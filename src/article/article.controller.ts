import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticle } from './article.dto';
import { Article } from './article.entity';

@Controller('article')
export class ArticleController {
  constructor(private readonly appService: ArticleService) { }

  @Post('/upload')
  async signUpArticle(@Body() user: CreateArticle) {
    return await this.appService.register(user);
  }
  // 获取所有dify知识库
  @Get('/library')
  async getDifyLibrary() {
    return this.appService.fetchDifyLibrary();
  }
  // 根据 ID 获取本地存储的文章
  // @Get(':title')
  // async getUserById(@Param('title') title: string): Promise<Article> {
  //   return this.appService.getArticleById(title);
  // }

  // 获取所有本地存储的文章
  @Get()
  async getAllArticle(): Promise<Article[]> {
    return this.appService.getAllArticle();
  }


}