import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticle } from './article.dto';
import { Article } from './article.entity';

@Controller('article')
export class ArticleController {
  constructor(private readonly appService: ArticleService) { }
  // 上传文章（本地存储+创建dify知识库+返回library_id给本地数据库）
  // @Post('/upload')
  // async signUpArticle(@Body() article: CreateArticle) {
  //   return await this.appService.register(article);
  // }
  // 上传文件以创建dify知识库
  @Post('/upload')
  async upload_dify(@Body() article: CreateArticle) {
    const data = await this.appService.createLibrary(article) // 以上传内容创建空知识库
    const id = data.id // 新知识库的id
    console.log('id', id);
    const document_data = await this.appService.createLibraryArticle(id, article)// 在刚创建的知识库中创建文本
    const result = this.appService.register(article, id);// 在本地备份知识库中的文本（要写入知识库id）
    return result
  }
  // 获取所有dify知识库
  @Get('/library')
  async getDifyLibrary() {
    return this.appService.fetchDifyLibrary();
  }
  // 删除知识库
  @Post(':dataset_id')
  async deletLibrary(@Param('dataset_id') dataset_id: string) {
    return this.appService.deletDifyLibrary(dataset_id);

  }

  // 获取所有dify知识库文档列表
  @Get('/library/files')
  async getDifyLibraryFiles() {
    return this.appService.fetchDifyLibraryFiles();
  }

  // 获取所有dify知识库文档列表中对应的文章
  @Get('/propertyArticle')
  async getPropertyArticle() {
    return this.appService.getPropertyArticle();
  }

  // 根据 ID 获取本地存储的文章
  @Get(':title')
  async getUserById(@Param('title') title: string): Promise<Article> {
    return this.appService.getArticleById(title);
  }

  // 获取所有本地存储的文章
  @Get()
  async getAllArticle(): Promise<Article[]> {
    return this.appService.getAllArticle();
  }


}