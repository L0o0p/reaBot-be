import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, InternalServerErrorException, Param, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticle, CreatePaper } from './article.dto';
import { Article } from './entities/article.entity';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { DifyService } from 'src/chat/dify.service';
import { PaperService } from './paper.service';
import { DataSource, Repository } from 'typeorm';
import { Paper } from './entities/paper.entity';
import * as mammoth from 'mammoth';
import { get } from 'http';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from 'src/answer-sheet/entities/questions.entity';
import { AnswerSheet } from 'src/answer-sheet/entities/answer-sheet.entity';
import { Answer } from 'src/answer-sheet/entities/answers.entity';
import { UsersService } from 'src/users/users.service';



@UseGuards(JwtAuthGuard)
@Controller('paper')
export class PaperController {
    logger: any;
    constructor(
        private readonly userService: UsersService,
        private readonly chatService: DifyService,
        private readonly articleService: ArticleService,
        private readonly paperService: PaperService,
        private dataSource: DataSource,
        @InjectRepository(AnswerSheet)
        private answersSheetRepository: Repository<AnswerSheet>,
        @InjectRepository(Answer)
        private answersRepository: Repository<Answer>,
        @InjectRepository(Article)
        private articleRepository: Repository<Article>,
        @InjectRepository(Question)
        private questionsRepository: Repository<Question>,
        @InjectRepository(Paper)
        private paperRepository: Repository<Paper>
    ) {
    }
    // 创建试卷（从前端获取title）
    @Post('create')
    async createPaper(@Body() createArticleDto: CreatePaper) {
        const articleA_title = createArticleDto.titles[0];
        const articleB_title = createArticleDto.titles[1];
        console.log('articleA_title:', articleA_title);
        console.log('articleB_title:', articleB_title);
        // 验证articleA_title和articleB_title是否为空以及是否重复
        if (!articleA_title || !articleB_title) {
            return { message: '文章标题不能为空' };
        }
        if (articleA_title === articleB_title) {
            return { message: '同一片文章不能被绑定在统一轮次' };
        }
        console.log('初次验证通过');
        // 调用paperService的createPaper方法
        const paper = await this.paperService.createPaper(articleA_title, articleB_title);
        return createArticleDto;
    }

    // 获取所有paper
    @Get('all')
    async getAllPaper() {
        const allPaper = await this.paperService.getAllPaper();

        // 使用 Promise.all 来等待所有异步操作完成
        const paperList = await Promise.all(allPaper.map(async paper => {
            const articleAId = paper.articleAId;
            const articleBId = paper.articleBId;
            const articleA_title = (await this.articleService.findByArticleId(articleAId)).title;
            const articleB_title = (await this.articleService.findByArticleId(articleBId)).title;
            const newPaper = {
                id: paper.id,
                articleA_title: articleA_title,
                articleB_title: articleB_title,
            };
            return newPaper;
        }));

        console.log('paperListX:', paperList);

        return paperList;
    }

    @Get('getPaperById/:id')
    async getPaperById(@Param('id') id: number): Promise<any> {
        // 拿到paper对象
        const paper = await this.paperService.getPaperById(id);
        // 从对象获取title
        const articleAId = paper.articleAId;
        const articleBId = paper.articleBId;
        const articleA_title = (await this.articleService.findByArticleId(articleAId)).title;
        const articleB_title = (await this.articleService.findByArticleId(articleBId)).title;
        // 从对象获取doc
        const docsA = (await this.articleService.getArticleDocByTitle(articleA_title))[0];
        const docsB = (await this.articleService.getArticleDocByTitle(articleB_title))[0];
        console.log(docsA.content);
        // 从doc获取文本内容
        let articleA_Text, articleB_Text = '';
        if (docsA && docsA.content) {
            console.log('Entered the if statement');
            const result = await mammoth.extractRawText({ buffer: Buffer.from(docsA.content) });
            articleA_Text = result.value;
            console.log('articleA_Text:', articleA_Text);
        }
        if (docsB && docsB.content) {
            console.log('Entered the if statement');
            const result = await mammoth.extractRawText({ buffer: Buffer.from(docsB.content) });
            articleB_Text = result.value;
            console.log('articleB_Text:', articleB_Text);
        }
        const newPaper = {
            id: id,
            articleA_title: articleA_Text,
            articleB_title: articleB_Text,
        };
        return newPaper
    }

    @Get('testt')
    async testt(
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      }
    }
    ) {
        console.log('req.user.userId',req.user.userId);
        const lastArticle = await this.paperService.getProgress(req.user.userId)
        const currentArticleKey = lastArticle.currentArticleKey
        const currentQuestionNum = lastArticle.currentQuestionNum
        const progress = {currentArticleKey, currentQuestionNum}
        // return lastArticle
        return  progress ;
    }

    @Get('currentPaper')
    async getCurrentPaperAndArticle(
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      }
    }
    ) {
        console.log('req.user.userId',req.user.userId);
        const lastArticle = await this.paperService.getProgress(req.user.userId)
        const currentArticleKey = lastArticle.currentArticleKey
        const currentQuestionNum = lastArticle.currentQuestionNum
        const progress = {currentArticleKey, currentQuestionNum}
        // return lastArticle
        const currentPaper = await this.paperService.getCurrentPaper(req.user.userId)
        return { currentPaper, progress };
    }

    //修改机器人使用的知识库(使用标题)
    @Get('/nextPaper')
    @HttpCode(HttpStatus.OK) // 明确设置 HTTP 状态码为 200
    async changeSourceLibraryByTittle(
        @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      }
    }
    ) {
        // 知道现在的article ⬇️
        const currentArticle_id = (await this.articleService.getPropertyArticle(req.user.userId)).id
        // 知道现在的paper ⬇️
        const currentPaper_id = ((await this.paperRepository.findOne({
            where: [
                { articleAId: currentArticle_id, },
                { articleBId: currentArticle_id, }
            ]
        }))).id
        
        //👉 插入一个计算当前paper总分的函数并且把他录入对应答题卡
        const currentPaperScore = await this.paperService.getPaperScore(
            currentPaper_id,
            req.user.userId
        )

        // 推算出下一个paper的id ⬇️
        // 推算出下一个paper的articleA ⬇️
        // 先把所有paper拿出来做成一个列表
        const paperList = await this.getAllPaper()
        console.log('paperList', paperList);
        // 设定规则，如果没有下一个就选择最初的paper
        let nextPaperId = await this.paperService.findNextMinId(currentPaper_id)
        if (nextPaperId > paperList.length) { nextPaperId = paperList[0].id }
        // 拿到下一个paper对象
        const nextPaper = await this.paperService.getPaperById(nextPaperId);
        // 切换到articleA的知识库
        // 从对象获取title
        const articleAId = nextPaper.articleAId;
        const articleBId = nextPaper.articleBId;
        const articleA_title = (await this.articleService.findByArticleId(articleAId)).title;
        const articleB_title = (await this.articleService.findByArticleId(articleBId)).title;
        // 从对象获取doc
        const docsA = (await this.articleService.getArticleDocByTitle(articleA_title))[0];
        const docsB = (await this.articleService.getArticleDocByTitle(articleB_title))[0];
        console.log(docsA.content);
        // 从doc获取文本内容
        let articleA_Text, articleB_Text = '';
        if (docsA && docsA.content) {
            console.log('Entered the if statement');
            const result = await mammoth.extractRawText({ buffer: Buffer.from(docsA.content) });
            articleA_Text = result.value;
            console.log('articleA_Text:', articleA_Text);
        }
        if (docsB && docsB.content) {
            console.log('Entered the if statement');
            const result = await mammoth.extractRawText({ buffer: Buffer.from(docsB.content) });
            articleB_Text = result.value;
            console.log('articleB_Text:', articleB_Text);
        }
        const newPaper = {
            articleA_title: articleA_Text,
            articleB_title: articleB_Text,
        };
        // return newPaper
        // 切换到articleA_title对应的知识库
        const botId = (await this.userService.getBotIdByUserId(req.user.userId)).bot_id;

        const nextLibraryId = (await this.articleRepository.find({ where: { id: articleAId } }))[0].library_id
        console.log('nextLibraryId:', nextLibraryId);
        // 切换知识库
        const result = await this.chatService.changeSourceLibrary(botId, nextLibraryId);

        // 再次获取知识库，看看现在用的是什么知识库（library_id,articleTitle,paperId)
        const newLibraryId = await this.chatService.fetchBotLibraryId(req.user.userId)
        const newPaperId = (await this.paperRepository.findOne({
            where: [
                { articleAId: articleAId },
                { articleBId: articleBId }
            ]
        })).id
        const feedback = {
            previousPaperScore:currentPaperScore,
            paperId: newPaperId,//paperId
            articleA: {
                title: articleA_title,
                content: articleA_Text,
            },
            articleB: {
                title: articleB_title,
                content: articleB_Text,
            },
            result:result
        }
        return feedback
    }

    @Get('/getPaperScore')
    async getPaperScore(
        @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      }
    }
    ) {
        // 知道现在的article ⬇️
        const currentArticle_id = (await this.articleService.getPropertyArticle(req.user.userId)).id
        console.log('currentArticle_id',currentArticle_id);
        
        // 知道现在的paper ⬇️
        const currentPaper_id = ((await this.paperRepository.findOne({
            where: [
                { articleAId: currentArticle_id, },
                { articleBId: currentArticle_id, }
            ]
        }))).id
        
        //👉 插入一个计算当前paper总分的函数并且把他录入对应答题卡
        const currentPaperScore = await this.paperService.getPaperScore(
            currentPaper_id,
            req.user.userId
        )
        return currentPaperScore
    }
}