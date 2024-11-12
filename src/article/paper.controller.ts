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



@UseGuards(JwtAuthGuard)
@Controller('paper')
export class PaperController {
    logger: any;
    constructor(
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

    // @Get('nextPaper')
    // async getPaperBycurrentId(): Promise<any> {
    //     const library_id = await this.chatService.fetchBotLibraryId()
    //     console.log('library_id', library_id);
    //     const currentArticleId = (await this.articleRepository.find({ where: { library_id: library_id } }))[0].id
    //     console.log('currentArticleId', currentArticleId);
    //     const currentPaperId = (await this.paperRepository.findOne({
    //         where: [
    //             { articleAId: currentArticleId },
    //             { articleBId: currentArticleId }
    //         ]
    //     })).id
    //     console.log('currentPaperId', currentPaperId);
    //     // 先把所有paper拿出来做成一个列表
    //     const paperList = await this.getAllPaper()
    //     console.log('paperList', paperList);
    //     // 设定规则，如果没有下一个就选择最初的paper
    //     let nextPaperId = currentPaperId + 1
    //     if (nextPaperId > paperList.length) { nextPaperId = paperList[0].id }
    //     // 拿到paper对象
    //     const paper = await this.paperService.getPaperById(nextPaperId);
    //     // 从对象获取title
    //     const articleAId = paper.articleAId;
    //     const articleBId = paper.articleBId;
    //     const articleA_title = (await this.articleService.findByArticleId(articleAId)).title;
    //     const articleB_title = (await this.articleService.findByArticleId(articleBId)).title;
    //     // 从对象获取doc
    //     const docsA = (await this.articleService.getArticleDocByTitle(articleA_title))[0];
    //     const docsB = (await this.articleService.getArticleDocByTitle(articleB_title))[0];
    //     console.log(docsA.content);
    //     // 从doc获取文本内容
    //     let articleA_Text, articleB_Text = '';
    //     if (docsA && docsA.content) {
    //         console.log('Entered the if statement');
    //         const result = await mammoth.extractRawText({ buffer: Buffer.from(docsA.content) });
    //         articleA_Text = result.value;
    //         console.log('articleA_Text:', articleA_Text);
    //     }
    //     if (docsB && docsB.content) {
    //         console.log('Entered the if statement');
    //         const result = await mammoth.extractRawText({ buffer: Buffer.from(docsB.content) });
    //         articleB_Text = result.value;
    //         console.log('articleB_Text:', articleB_Text);
    //     }
    //     const newPaper = {
    //         articleA_title: articleA_Text,
    //         articleB_title: articleB_Text,
    //     };
    //     // return newPaper
    //     // 切换到articleA_title对应的知识库
    //     const botId = 'a2ff7b15-cfc4-489d-96cf-307d33c43b00';
    //     let articleA_Text_Title = articleA_Text.split('\n')[0]
    //     if (articleA_Text_Title.includes(': ')) {
    //         console.log('题目包含冒号和空格');
    //         articleA_Text_Title = articleA_Text_Title.split(': ')[1];
    //         console.log(articleA_Text_Title);  // 输出结果
    //     }
    //     const nextLibraryId = (await this.articleRepository.find({ where: { title: articleA_Text_Title } }))[0].library_id
    //     console.log('nextLibraryId:', nextLibraryId);
    //     // 切换知识库
    //     const result = await this.chatService.changeSourceLibrary(botId, nextLibraryId);

    //     // 再次获取知识库，看看现在用的是什么知识库（library_id,articleTitle,paperId)
    //     const newLibraryId = await this.chatService.fetchBotLibraryId()
    //     const newArticleTitle = await this.chatService.getArticleName(newLibraryId)
    //     const newPaperId = (await this.paperRepository.findOne({
    //         where: [
    //             { articleAId: currentArticleId },
    //             { articleBId: currentArticleId }
    //         ]
    //     })).id
    //     const feedback = {
    //         library_id: newLibraryId,
    //         articleTitle: newArticleTitle,
    //         newPaper: {
    //             id: newPaperId,//paperId
    //             articleA_title: articleA_Text,
    //             articleB_title: articleB_Text,
    //         }
    //     }
    //     return feedback
    // }

    @Get('currentPaper')
    async getCurrentPaperAndArticle() {
        // 1. 先根据使用的知识库获取当前文章信息
        const currentArticleInfo = await this.articleService.getPropertyArticle();
        const currentArticleId = currentArticleInfo.id
        // 2. 根据当前文章来获取其绑定的paper
        const currentPaper = (await this.paperRepository.findOne({
            where: [
                { articleAId: currentArticleId, },
                { articleBId: currentArticleId, }
            ]
        }))
        console.log('newPaper', currentPaper);
        const paperId = currentPaper.id
        const articleA = (await this.articleRepository.find({ where: { id: currentPaper.articleAId } }))[0]
        const articleB = (await this.articleRepository.find({ where: { id: currentPaper.articleBId } }))[0]
        // 3. 返回paper信息和当前文章信息
        return {
            paperId: paperId,
            articleA: articleA,
            articleB: articleB
        };
    }

    //修改机器人使用的知识库(使用标题)
    @Get('/nextPaper')
    @HttpCode(HttpStatus.OK) // 明确设置 HTTP 状态码为 200
    async changeSourceLibraryByTittle(@Req() req: any & { user: { id: number, username: string } }) {
        // 知道现在的article ⬇️
        const currentArticle_id = (await this.articleService.getPropertyArticle()).id
        // 知道现在的paper ⬇️
        const currentPaper_id = ((await this.paperRepository.findOne({
            where: [
                { articleAId: currentArticle_id, },
                { articleBId: currentArticle_id, }
            ]
        }))).id
        
        //👉 插入一个计算当前paper总分的函数并且把他录入对应答题卡
        const currentPaperScore = await this.getPaperScore(
            currentPaper_id,
            req.user.user.userId
        )

        // 推算出下一个paper的id ⬇️
        // 推算出下一个paper的articleA ⬇️
        // 先把所有paper拿出来做成一个列表
        const paperList = await this.getAllPaper()
        console.log('paperList', paperList);
        // 设定规则，如果没有下一个就选择最初的paper
        let nextPaperId = currentPaper_id + 1
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
        const botId = 'a2ff7b15-cfc4-489d-96cf-307d33c43b00';

        const nextLibraryId = (await this.articleRepository.find({ where: { id: articleAId } }))[0].library_id
        console.log('nextLibraryId:', nextLibraryId);
        // 切换知识库
        const result = await this.chatService.changeSourceLibrary(botId, nextLibraryId);

        // 再次获取知识库，看看现在用的是什么知识库（library_id,articleTitle,paperId)
        const newLibraryId = await this.chatService.fetchBotLibraryId()
        const newArticleTitle = await this.chatService.getArticleName(newLibraryId)
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
                title: articleA_Text,
                content: articleA_Text,
            },
            articleB: {
                title: articleB_Text,
                content: articleB_Text,
            },
        }
        return feedback
    }

    @Get('/getPaperScore')
    async getPaperScore(paperId: number, userId: number) {
        // const articleId = 2;
        // const answerSheetId = 2;
        // 取得paperId
        console.log('userId', userId);
        console.log('paperId', paperId);
        // 取得paperId对下的两篇文章的articleId
        const articleAId = (await this.paperRepository.find({ where: { id: paperId } }))[0].articleAId;
        const articleBId = (await this.paperRepository.find({ where: { id: paperId } }))[0].articleBId;
        console.log('articleIdX',articleAId,articleBId);
        
        const answerSheet = await this.answersSheetRepository.findOne({
    where: { paper: {id:paperId}, user: { id: userId } },
});
        const answerSheetId = answerSheet.id
        console.log('answerSheetId', answerSheetId);
        
        let totalScore = 0;

        const questionsA = await this.questionsRepository.find({
            where: { articleId: articleAId },
            select: ['id']
        });

         const questionsB = await this.questionsRepository.find({
            where: { articleId: articleBId },
            select: ['id']
        });

        const questionIdListA = questionsA.map(question => question.id);
        console.log('questionIdListA:', questionIdListA);
        const questionIdListB = questionsB.map(question => question.id);
        console.log('questionIdListB:', questionIdListB);
        for (const questionId of questionIdListA) {
            console.log('Checking questionId:', questionId); // 输出当前正在检查的 questionId
            const answer = await this.answersRepository.findOne({
                where: {
                    question: { id: questionId },
                    answerSheet: { id: answerSheetId },
                },
            });

            console.log('Answer for questionId', questionId, ':', answer); // 输出获取到的答案

            if (answer && answer.isCorrect) {
                console.log('Correct answer for questionId', questionId); // 确认找到正确答案
                totalScore += 1;
            }
        }
        for (const questionId of questionIdListB) {
            console.log('Checking questionId:', questionId); // 输出当前正在检查的 questionId
            const answer = await this.answersRepository.findOne({
                where: {
                    question: { id: questionId },
                    answerSheet: { id: answerSheetId },
                },
            });

            console.log('Answer for questionId', questionId, ':', answer); // 输出获取到的答案

            if (answer && answer.isCorrect) {
                console.log('Correct answer for questionId', questionId); // 确认找到正确答案
                totalScore += 1;
            }
        }

        console.log('Total Score:', totalScore); // 输出最终总分
        this.answersSheetRepository.update({ id: answerSheetId }, { totalScore: totalScore });// 更新答案表的分数
        return totalScore;

    }
}