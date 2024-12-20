import { Body, Controller, Delete, Get, HttpException, HttpStatus, InternalServerErrorException, Param, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticle } from './article.dto';
import { Article } from './entities/article.entity';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { DifyService } from 'src/chat/dify.service';
import * as mammoth from 'mammoth';
import { Question } from 'src/answer-sheet/entities/questions.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PaperService } from './paper.service';
import { UsersService } from 'src/users/users.service';
import { TextPreprocessorService } from './upload.service';


interface QuestionItem {
  question: string;
  options: string[];
  id: number;
  correctAnswer: string;
  explanation: string;
  score: number;
  f_Question: string;
  f_Options: string[];
  f_correctAnswer: string;
  articleId: number
}
@UseGuards(JwtAuthGuard)
@Controller('article')
export class ArticleController {
  logger: any;
  constructor(
    private readonly appService: ArticleService,
    private readonly paperService: PaperService,
    private readonly chatService: DifyService,
    private readonly uploadService: TextPreprocessorService,
    // private dataSource: DataSource,
    private userService: UsersService,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
  ) { }

  @Get('all')
  async getAllQuestions() {
    return await this.articleRepository.find();
  }

  // 接受文档并且创建知识库 + 存储到本地数据库(文章)
  @Post('adoc_dify')
  @UseInterceptors(FileInterceptor('file'))
  async upload_ArticleFileTodify(@UploadedFile() file: Express.Multer.File) {
    // 1. 接受文档并且创建知识库 + 存储到本地数据库
    const article_title = file.originalname.split('.')[0] // 获取文件名
    console.log('article_title', article_title);
    const data = await this.appService.createLibrary(article_title) // 使用上传内容创建空知识库
    const id = data.id // 新知识库的id
    // const id = '2cf5d66d-a3fe-481e-9619-3b0a4d688e94' // 测试createLibraryByDoc使用知识库
    const result = await this.appService.createLibraryByDoc(file, id)
    // 2. 读取doc内的文本内容到数据库
    const buf = { buffer: Buffer.from(file.buffer) }
    const rawTextData = await mammoth.extractRawText(buf);
    const htmlData = await mammoth.convertToHtml(buf);
    console.log(htmlData)
    const rawText = rawTextData.value;
    console.log('rawText', rawText);
    function getTextAfterFirstNewline(text) {
      const index = text.indexOf('\n');
      if (index !== -1) {
        return text.substring(index + 1);
      }
      return ""; // 如果没有换行符，返回空字符串
    }
    const processedText = getTextAfterFirstNewline(rawText);
    // 3. 储存到本地
    const tag = "article"
    // processedText,
    this.appService.save_articleFile(file, id, tag, htmlData.value);

    const finishText = 'Article have been saved'
    console.log(finishText);
    return finishText
  }

  // 接受文档并且存储到本地数据库(问题)并拿出来存到answer数据表里
  @Post('answers_doc_dify')
  @UseInterceptors(FileInterceptor('file'))
  async upload_AnswerFileTodify(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      }
    }
  ) {
    // 1. 接受文档
    const article_title = file.originalname.split('.')[0] // 获取文件名
    console.log('file', file);

    // 2. 储存到本地
    // const tag = "answer"
    // const result = this.appService.save_attachFile(file, tag);
    // return result

    // 3. 读取doc内的文本内容到数据库
    const data = await mammoth.extractRawText({ buffer: Buffer.from(file.buffer) });
    const rawText = data.value;
    const processedList: string[] = rawText.split('\n').filter(line => line !== '')
    console.log('processedList', processedList);
    const savableData: number[] = await this.appService.convertLettersToNumbers(processedList)
    console.log('savableData', savableData);
    // 4. 存储doc内的文本内容到数据库
    // 获取这个文件的名字=>title=>article_id&questions_id来判断存在哪里
    const articleId = (await this.appService.getPropertyArticle(req.user.userId)).id
    console.log('articleIdX', articleId);

    savableData.forEach(async (item: any, index: number) => {
      // Assuming questionData contains correctAnswer and score
      await this.questionRepository.update(
        { id: index + 1, articleId },
        { correctAnswer: item }
      );
    });

    return savableData
  }

  // 接受文档并且存储到本地数据库(问题)
  @Post('qdoc_dify')
  @UseInterceptors(FileInterceptor('file'))
  async upload_QuestionsFileTodify(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      }
    }
  ) {
    // 1. 接受文档
    const article_title = file.originalname.split('.')[0] // 获取文件名
    console.log('article_title', article_title);

    // 2. docx储存到本地
    const tag = "questions"
    const result = this.appService.save_attachFile(file, tag);

    // 3. 读取doc内的文本内容到数据库
    const data = await mammoth.extractRawText({ buffer: Buffer.from(file.buffer) });
    const rawText = data.value;
    console.log('rawText', rawText);;

    // return
    // Splitting the text into chunks based on double newlines
    const chunks = rawText.split('\n\n\n'); // 分开每个「问题块」
    console.log('Chunks:', chunks);
    const articleId = (await this.appService.getPropertyArticle(req.user.userId)).id

    for (const chunk of chunks) {// 对于每个「问题块」：
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      console.log('lines:', lines);
      const question = lines[0];// 1. 取出「问题本身」
      console.log('question:', question);
      const options = lines.slice(1); // 2. 取出「问题选项」
      console.log('options:', options);

      const quizQuestion = new Question();
      quizQuestion.question = question;
      quizQuestion.options = options;
      quizQuestion.score = 1;
      quizQuestion.articleId = articleId;
      await this.questionRepository.save(quizQuestion);
    }

    const finishText = 'Questions have been saved'
    console.log(finishText);
    return finishText
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
  // @Post(':dataset_id')
  // async deletLibrary(@Param('dataset_id') dataset_id: string) {
  //   // 鉴权
  //   // if (!req.user.anim_permission) {
  //   //   const feedback = '你没有权限进行该操作'
  //   //   return feedback
  //   // }

  //   return this.appService.deletDifyLibrary(dataset_id);
  // }

  // 获取所有dify知识库文档列表
  @Get('/library/files')
  async getDifyLibraryFiles(
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      }
    }
  ) {
    const botId = (await this.userService.getBotIdByUserId(req.user.userId)).bot_id;
    return this.appService.fetchDifyLibraryFiles(botId);
  }

  // 获取所用dify知识库文档列表中对应的文章
  @Get('/propertyArticle')
  async getPropertyArticle(
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      }
    }
  ) {
    return this.appService.getPropertyArticle(req.user.userId);
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

  // 获取目标文章的doc
  @Get('adoc_list/:title')
  async get_articleDocList(@Param('title') title: string, @Res() res) {
    try {
      const docs = await this.appService.getArticleDocByTitle(title);
      res.json(docs);  // 使用 res.json 确保返回的是 JSON 格式
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 获取目标文章问题的doc
  @Get('qdoc_list/:title')
  async get_questionsDocList(@Param('title') title: string, @Res() res) {
    try {
      const docs = await this.appService.getQuestionsDocByTitle(title);
      console.log('docsX:', docs);
      res.json(docs);  // 使用 res.json 确保返回的是 JSON 格式
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 添加文章提示
  @Post('add_tips')
  async addTips(@Body('tips') tips: string[]) {
    // const library_id = await this.chatService.fetchBotLibraryId()
    // const current_article_title = this.chatService.getArticleName(library_id)
    const current_article_title = 'copy'
    const docs = await this.appService.addTips(current_article_title, tips);
    console.log('docs:', docs);
    return
  }

  // // 获取当前文章的tips内容
  // @Get('get_tips/:title')
  // async getTips(@Param('title') title: string) {
  //   const data = await this.appService.getArticleByTitle(title);
  //   const tips = data.tips;
  //   console.log('tips:', tips);
  //   return tips
  // }

  // 获取当前文章的questions的doc文本
  @Get('get/doc_text')
  async getDocText(
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      }
    }
  ) {
    console.log('proX');
    console.log('req.user.usrId', req.user.userId);
    const library_id = await this.chatService.fetchBotLibraryId(req.user.userId);
    console.log('library_id', library_id);
    const title = (await this.chatService.getArticleName(library_id, req.user.userId)).title + '.docx'
    console.log('titleX:', title);
    const tag = 'questions'
    const articleQuestions: string[] = await this.appService.getDocumentByNameAndTag(title, tag)
    return articleQuestions;
  }

  @Get('get/questions')
  async getQuestions(
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      }
    }
  ) {
    console.log('req.user.userId', req.user);
    const userId = req.user.userId;
    const library_id = await this.chatService.fetchBotLibraryId(userId)
    const getArticle = (await this.chatService.getArticleName(library_id, userId))
    const title = getArticle.title
    const article_id = (await this.getUserById(title)).id

    const articleQuestions: QuestionItem[] = await this.appService.getQuestionsByArticleID(article_id)
    // 把跟踪题提出来
    let trackingQuestions = []
    for (let i = 0; i < articleQuestions.length; i++) {
      const a = {
        id: (articleQuestions[i] as QuestionItem).id,
        articleId: articleQuestions[i].articleId,
        question: articleQuestions[i].question,
        options: articleQuestions[i].f_Options,
        correctAnswer: articleQuestions[i].f_correctAnswer
      }
      trackingQuestions.push(a)
    }
    return { articleQuestions, trackingQuestions };
  }

  @Get('get/progress')
  async getProcceed(
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      }
    }
  ) {
    // 获取当前文章
    const currentArticle = (await this.appService.getPropertyArticle(req.user.userId))
    const article_id = currentArticle.id
    // 获取当前题号
    const index = (await this.appService.getLatestAnswerRank(article_id)).rank
    console.log(`当前做到${currentArticle.id}. ${currentArticle.title}的第${index}题`);
    return index
  }

  @Post('get/uploadDoc')
  @UseInterceptors(FileInterceptor('file'))
  async processText(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      }
    }
  ) {
    // 1. 接受文档并且创建知识库 + 存储到本地数据库
    const article_title = file.originalname.split('.')[0] // 获取文件名
    console.log('article_title', article_title);
    const data = await this.appService.createLibrary(article_title) // 使用上传内容创建空知识库
    console.log('data', data);

    const id = data.id // 新知识库的id
    // const id = '2cf5d66d-a3fe-481e-9619-3b0a4d688e94' // 测试createLibraryByDoc使用知识库
    const feedback = await this.appService.createLibraryByDoc(file, id)
    console.log('data', data);
    console.log('feedback', feedback);

    // 2. 处理doc中的article文本并储存文章（doc+内容文本）
    await this.uploadService.processArticle(file, id)
    if (!feedback || !data) return { code: 400, message: '创建知识库失败,有可能因为文件名超过40个字符' }
    console.log('file', file);

    // 读取doc内容
    const buf = { buffer: Buffer.from(file.buffer) }
    const rawTextData = await mammoth.extractRawText(buf);
    const rawText = rawTextData.value;
    console.log('rawText', rawText);

    // 将doc内容中的「练习题目」「阅读文章」「跟踪练习」分开
    const procceedText = await this.uploadService.processText(rawText)
    console.log('procceedText', procceedText);

    // 「练习题目」进行处理并存储
    const articleTitle = file.originalname.split('.')[0];
    const articleId = (await this.articleRepository.findOne({ where: { title: articleTitle } }))?.id
    console.log('articleId', articleId);
    // const articleId = (await this.appService.getPropertyArticle(req.user.userId)).id

    // 处理跟踪题
    const procceedF_Qustions = await this.uploadService.processFQuestions(
      procceedText.trackingQuestionsText,
    )
    console.log('procceedF_Qustions', procceedF_Qustions.length, procceedF_Qustions);
    // 处理练习题
    const procceedQustions = await this.uploadService.processQuestions(
      procceedText.questionsText,
      procceedF_Qustions,
      articleId
    )
    console.log('procceedQustions', procceedQustions);



    return procceedF_Qustions
  }


}

