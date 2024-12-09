import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ArticleService } from "./article.service";
import { Article } from "./entities/article.entity";
import { JwtAuthGuard } from "src/auth/jwt.guard";
import { FileInterceptor } from "@nestjs/platform-express";
import { DifyService } from "src/chat/dify.service";
import * as mammoth from "mammoth";
import { Question } from "src/answer-sheet/entities/questions.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { PaperService } from "./paper.service";
import { UsersService } from "src/users/users.service";
import { TextPreprocessorService } from "./upload.service";
import {
  ArticleCollection,
  ArticleQuestion,
  BotId,
  CreateArticle,
  KnowledgeBaseResponse,
  QuizResponse,
  TrackingQuestion,
} from "./dto/article.dto";

@UseGuards(JwtAuthGuard)
@Controller("article")
export class ArticleController {
  logger: any;
  constructor(
    private readonly appService: ArticleService,
    private readonly paperService: PaperService,
    private readonly chatService: DifyService,
    private readonly uploadService: TextPreprocessorService,
    // private dataSource: DataSource,
    private userService: UsersService,
    @InjectRepository(Question) private questionRepository: Repository<
      Question
    >,
    @InjectRepository(Article) private articleRepository: Repository<Article>,
  ) {}

  @Get("all")
  async getAllQuestions() {
    return await this.articleRepository.find() as ArticleCollection;
  }

  // 获取所有dify知识库
  @Get("/library")
  async getDifyLibrary() {
    return this.appService
      .fetchDifyLibrary() as unknown as KnowledgeBaseResponse;
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
  @Get("/library/files")
  async getDifyLibraryFiles(
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      };
    },
  ) {
    const bot: BotId = await this.userService.getBotIdByUserId(req.user.userId);
    const botId: string = bot.bot_id;
    return this.appService.fetchDifyLibraryFiles(botId) as unknown as string;
  }

  // 获取所用dify知识库文档列表中对应的文章
  @Get("/propertyArticle")
  async getPropertyArticle(
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      };
    },
  ) {
    const progress = await this.paperService.getProgress(req.user.userId);
    return progress.lastArticle as any;
  }

  // 根据 ID 获取本地存储的文章
  @Get(":title")
  async getUserById(@Param("title") title: string): Promise<Article> {
    const article: Article = await this.appService.getArticleByTitle(title);
    return article;
  }

  // 获取所有本地存储的文章
  @Get()
  async getAllArticle(): Promise<Article[]> {
    return this.appService.getAllArticle();
  }

  // // 获取当前文章的questions的doc文本
  // @Get('get/doc_text')
  // async getDocText(
  //   @Req() req: {
  //     user: {
  //       id: number;
  //       userId: number;
  //       username: string;
  //     }
  //   }
  // ) {
  //   console.log('proX');
  //   console.log('req.user.usrId', req.user.userId);
  //   const library_id = await this.chatService.fetchBotLibraryId(req.user.userId);
  //   console.log('library_id', library_id);
  //   const title = (await this.chatService.getArticleName(library_id, req.user.userId)).title + '.docx'
  //   console.log('titleX:', title);
  //   const tag = 'questions'
  //   const articleQuestions: string[] = await this.appService.getDocumentByNameAndTag(title, tag)
  //   return articleQuestions;
  // }

  @Get("get/questions")
  async getQuestions(
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      };
    },
  ): Promise<QuizResponse> {
    console.log("req.user.userId", req.user);
    const userId = req.user.userId;
    // const library_id = await this.chatService.fetchBotLibraryId(userId);
    // const getArticle = await this.chatService.getArticleName(
    //   library_id,
    //   userId,
    // );
    // const title = getArticle.title;
    // const article_id = (await this.getUserById(title)).id;
    const progress = await this.paperService.getProgress(userId);

    const articleQuestions: ArticleQuestion[] = await this.appService
      .getQuestionsByArticleID(progress.lastArticle.id);
    // 把跟踪题提出来
    let trackingQuestions: TrackingQuestion[] = [];
    for (let i = 0; i < articleQuestions.length; i++) {
      const a = {
        id: (articleQuestions[i] as ArticleQuestion).id,
        articleId: articleQuestions[i].articleId,
        question: articleQuestions[i].question,
        options: articleQuestions[i].f_Options,
        correctAnswer: articleQuestions[i].f_correctAnswer,
      };
      trackingQuestions.push(a);
    }
    return { articleQuestions, trackingQuestions };
  }

  @Post("get/uploadDoc")
  @UseInterceptors(FileInterceptor("file"))
  async processText(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      };
    },
  ) {
    // 1. 接受文档并且创建知识库 + 存储到本地数据库
    const article_title: string = file.originalname.split(".")[0]; // 获取文件名
    console.log("article_title", article_title);
    const data = await this.appService.createLibrary(article_title); // 使用上传内容创建空知识库
    console.log("data", data);

    const id = data.id; // 新知识库的id
    console.log("data", data);

    // 读取doc内容
    const buf = { buffer: Buffer.from(file.buffer) };
    const rawTextData = await mammoth.extractRawText(buf);
    const rawText: string = rawTextData.value;
    console.log("rawText", rawText);

    // 将doc内容中的「练习题目」「阅读文章」「跟踪练习」分开
    const procceedText = await this.uploadService.processText(rawText);
    // 将「阅读文章」分段上传
    console.log("procceedText", procceedText);
    const chunks = procceedText.articleText.split("\n\n");
    chunks.forEach(async (chunk: string, index: number) => {
      const title = (index < 1)
        ? `文章题目：${article_title}`
        : `文章原文第${index}段`;
      const text = {
        title: title,
        content: title + "\n" + chunk,
        
      };
      const feedback = await this.appService.createLibraryText(id, text);
      console.log("feedbackXXX", feedback);
    });

    // 2. 处理doc中的article文本并储存文章（doc+内容文本）
    await this.uploadService.processArticle(file, rawText, id);
    // if (!feedback || !data) {
    //   return {
    //     code: 400,
    //     message: "创建知识库失败,有可能因为文件名超过40个字符",
    //   };
    // }
    console.log("file", file);

    // 上传问题和答案到dify
    const practiceSection = `「练习题目」`;
    const practiceUploadResult = await this.uploadService
      .chunksUploadToDifyLibrary(
        procceedText.questionsText,
        practiceSection,
        id,
      );
    const trackingPracticeSection = `「跟踪练习」`;
    const trackingPracticeUploadResult = await this.uploadService
      .chunksUploadToDifyLibrary(
        procceedText.trackingQuestionsText,
        trackingPracticeSection,
        id,
      );

    // 「练习题目」进行处理并存储
    const articleTitle = file.originalname.split(".")[0];
    const article = await this.articleRepository.findOne({
      where: { title: articleTitle },
    });
    const articleId = article.id;
    console.log("articleIdX", articleId);

    // 处理跟踪题
    const procceedF_Qustions = await this.uploadService.processFQuestions(
      procceedText.trackingQuestionsText,
    );
    console.log(
      "procceedF_Qustions",
      procceedF_Qustions.length,
      procceedF_Qustions,
    );
    // 处理练习题
    const procceedQustions = await this.uploadService.processQuestions(
      procceedText.questionsText,
      procceedF_Qustions,
      articleId,
    );
    console.log("procceedQustions", procceedQustions);

    return procceedF_Qustions;
  }
}
