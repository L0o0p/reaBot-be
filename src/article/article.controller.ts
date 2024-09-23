import { Body, Controller, Delete, Get, HttpException, HttpStatus, InternalServerErrorException, Param, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticle } from './article.dto';
import { Article } from './entities/article.entity';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';



@UseGuards(JwtAuthGuard)
@Controller('article')
export class ArticleController {
  logger: any;
  constructor(private readonly appService: ArticleService) { }
  // 接受文档并且存储再本地数据库
  @Post('doc_store')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileStore(@UploadedFile() file: Express.Multer.File) {
    return this.appService.saveFile(file);
  }
  // 接受文档并且创建知识库
  @Post('doc_dify')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileTodify(@UploadedFile() file: Express.Multer.File) {
    // throw new Error('Method not implemented.');
    // const article_title = file.originalname.split('.')[0] // 获取文件名
    // console.log('article_title', article_title);
    // const data = await this.appService.createLibrary(article_title) // 使用上传内容创建空知识库
    // // const id = data.id // 新知识库的id
    const id = '2cf5d66d-a3fe-481e-9619-3b0a4d688e94'
    const result = await this.appService.createLibraryByDoc(file, id)
    return result
  }
  // 接受并解读文档内容
  @Post('doc_read')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileToRead(@UploadedFile() file: Express.Multer.File) {
    const article_title = file.originalname.split('.')[0] // 获取文件名
    console.log('article_title', article_title);
    const data = await this.appService.createLibrary(article_title) // 使用上传内容创建空知识库
    return data
  }
  // 上传文件以创建dify知识库
  @Post('/upload')
  async upload_dify(@Body() article: CreateArticle) {
    // 鉴权
    // if (!req.user.anim_permission) {
    //   const feedback = '你没有权限进行该操作'
    //   return feedback
    // }
    const data = await this.appService.createLibrary(article.title) // 使用上传内容创建空知识库
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
    // 鉴权
    // if (!req.user.anim_permission) {
    //   const feedback = '你没有权限进行该操作'
    //   return feedback
    // }

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
    return this.appService.getArticleByTitle(title);
  }

  // 获取所有本地存储的文章
  @Get()
  async getAllArticle(): Promise<Article[]> {
    return this.appService.getAllArticle();
  }


@Get('doc_list/:title')
async getDocList(@Param('title') title: string, @Res() res) {
  try {
    const docs = await this.appService.getArticleDocByTitle(title);
    console.log('docs:',docs);
    res.json(docs);  // 使用 res.json 确保返回的是 JSON 格式
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
}