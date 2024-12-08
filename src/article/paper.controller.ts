import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
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
import { PaperService } from "./paper.service";
import { DataSource, Repository } from "typeorm";
import { Paper } from "./entities/paper.entity";
import * as mammoth from "mammoth";
import { get } from "http";
import { InjectRepository } from "@nestjs/typeorm";
import { Question } from "src/answer-sheet/entities/questions.entity";
import { AnswerSheet } from "../answer-sheet/entities/answer-sheet.entity";
import { Answer } from "src/answer-sheet/entities/answers.entity";
import { UsersService } from "src/users/users.service";
import { CreatePaper } from "./dto/article.dto";
import {
    CurrentPaper,
    LatestArticle,
    nextPaperResult,
    PaperProps,
    Progress,
} from "./dto/paper.dto";
import { newPaper } from "./dto/paper.dto";
import { AnswerSheetService } from "src/answer-sheet/answer-sheet.service";

@UseGuards(JwtAuthGuard)
@Controller("paper")
export class PaperController {
    logger: any;
    constructor(
        private readonly userService: UsersService,
        private readonly chatService: DifyService,
        private readonly articleService: ArticleService,
        private readonly paperService: PaperService,
        private dataSource: DataSource,
        private readonly answerSheetService: AnswerSheetService,
        @InjectRepository(AnswerSheet) private answersSheetRepository:
            Repository<AnswerSheet>,
        @InjectRepository(Answer) private answersRepository: Repository<Answer>,
        @InjectRepository(Article) private articleRepository: Repository<
            Article
        >,
        @InjectRepository(Question) private questionsRepository: Repository<
            Question
        >,
        @InjectRepository(Paper) private paperRepository: Repository<Paper>,
    ) {
    }
    // 创建试卷（从前端获取title）
    @Post("create")
    async createPaper(@Body() createArticleDto: CreatePaper) {
        const articleA_title = createArticleDto.titles[0];
        const articleB_title = createArticleDto.titles[1];
        console.log("articleA_title:", articleA_title);
        console.log("articleB_title:", articleB_title);
        // 验证articleA_title和articleB_title是否为空以及是否重复
        if (!articleA_title || !articleB_title) {
            return { message: "文章标题不能为空" };
        }
        if (articleA_title === articleB_title) {
            return { message: "同一片文章不能被绑定在统一轮次" };
        }
        console.log("初次验证通过");
        // 调用paperService的createPaper方法
        const paper: PaperProps = await this.paperService.createPaper(
            articleA_title,
            articleB_title,
        );
        return paper;
    }

    // 获取所有paper
    @Get("all")
    // async getAllPaper(): Promise<PaperProps[]> {
    async getAllPaper(): Promise<any> {
        const allPaper = await this.paperService.getAllPaper();

        // 使用 Promise.all 来等待所有异步操作完成
        const paperList = await Promise.all(allPaper.map(async (paper) => {
            const articleAId = paper.articleAId;
            const articleBId = paper.articleBId;
            const articleA_title =
                (await this.articleService.findByArticleId(articleAId)).title;
            const articleB_title =
                (await this.articleService.findByArticleId(articleBId)).title;
            const newPaper = {
                id: paper.id,
                articleA_title: articleA_title,
                articleB_title: articleB_title,
            };
            return newPaper;
        }));

        console.log("paperListX:", paperList);

        return paperList;
    }

    @Get("getPaperById/:id")
    async getPaperById(@Param("id") id: number): Promise<newPaper> {
        // 拿到paper对象
        const paper = await this.paperService.getPaperById(id);
        // 从对象获取title
        const articleAId = paper.articleAId;
        const articleBId = paper.articleBId;
        const articleA_title =
            (await this.articleService.findByArticleId(articleAId)).title;
        const articleB_title =
            (await this.articleService.findByArticleId(articleBId)).title;
        // 从对象获取doc
        const docsA =
            (await this.articleService.getArticleDocByTitle(articleA_title))[0];
        const docsB =
            (await this.articleService.getArticleDocByTitle(articleB_title))[0];
        console.log(docsA.content);
        // 从doc获取文本内容
        let articleA_Text, articleB_Text = "";
        if (docsA && docsA.content) {
            console.log("Entered the if statement");
            const result = await mammoth.extractRawText({
                buffer: Buffer.from(docsA.content),
            });
            articleA_Text = result.value;
            console.log("articleA_Text:", articleA_Text);
        }
        if (docsB && docsB.content) {
            console.log("Entered the if statement");
            const result = await mammoth.extractRawText({
                buffer: Buffer.from(docsB.content),
            });
            articleB_Text = result.value;
            console.log("articleB_Text:", articleB_Text);
        }
        const newPaper = {
            id: id,
            articleA_title: articleA_Text,
            articleB_title: articleB_Text,
        };
        return newPaper;
    }

    @Get("currentPaper")
    async getCurrentPaperAndArticle(
        @Req() req: {
            user: {
                id: number;
                userId: number;
                username: string;
            };
        },
    ): Promise<{
        currentPaper: CurrentPaper;
        progress: Progress;
        latestAnwerSheetID: number;
    }> {
        const userId = req.user.userId;
        // 初始化默认的进度
        let progress = {
            currentArticleKey: null,
            currentQuestionNum: null,
        };
        let lastestArticleProgress = await this.paperService.getProgress(
            userId,
        );
        if (lastestArticleProgress) {
            const currentPaper = await this.paperService.getCurrentPaper(
                userId,
            );
            // create new progress
            progress = {
                currentArticleKey: lastestArticleProgress.currentArticleKey,
                currentQuestionNum: lastestArticleProgress.currentQuestionNum,
            };
            return {
                currentPaper,
                progress,
                latestAnwerSheetID: lastestArticleProgress.currentAnserSheetID,
            };
        } else {
            const currentPaperID = await this.paperService
                .getPaperWithSmallestId();
            const answerSheet = await this.answerSheetService.createAnswerSheet(
                currentPaperID,
                req.user.userId,
            );
            const currentPaper = await this.paperService.getCurrentPaper(
                userId,
                answerSheet.id,
            );
            // lastestArticle = await this.paperService.getLatestArticle(userId);
            progress = {
                currentArticleKey: "A",
                currentQuestionNum: 0,
            };
            return {
                currentPaper,
                progress,
                latestAnwerSheetID: answerSheet.id,
            };
        }
        // console.log("lastestArticle", lastestArticle);

        // 检查 lastestArticle 是否存在并且有有效的属性
        // if (
        //     lastestArticle && lastestArticle.currentArticleKey !== undefined &&
        //     lastestArticle.currentQuestionNum !== undefined
        // ) {
        // } else {
        //     progress = {
        //         currentArticleKey: "A",
        //         currentQuestionNum: 0,
        //     };
        // }
    }

    //修改机器人使用的知识库(使用标题)
    // @Get("/nextPaper")
    // @HttpCode(HttpStatus.OK) // 明确设置 HTTP 状态码为 200
    // async changeSourceLibraryByTittle(
    //     @Req() req: {
    //         user: {
    //             id: number;
    //             userId: number;
    //             username: string;
    //         };
    //     },
    // ): Promise<nextPaperResult> {
    //     // 接收请求 查询即将开始的试卷
    //     const nextPaper = await this.paperService.getNextPaper(req.user.userId);

    //     // 切换到articleA的知识库
    //     // 从对象获取title
    //     const articleAId = nextPaper.articleAId;
    //     const articleBId = nextPaper.articleBId;
    //     const articleA_title =
    //         (await this.articleService.findByArticleId(articleAId)).title;
    //     const articleB_title =
    //         (await this.articleService.findByArticleId(articleBId)).title;
    //     // 获取文章内容
    //     const articleA_Text = (await this.articleRepository.findOne({
    //         where: { id: articleAId },
    //     })).content;
    //     const articleB_Text = (await this.articleRepository.findOne({
    //         where: { id: articleBId },
    //     })).content;
    //     // 从对象获取doc
    //     // const docsA = (await this.articleService.getArticleDocByTitle(articleA_title))[0];
    //     // const docsB = (await this.articleService.getArticleDocByTitle(articleB_title))[0];
    //     // console.log(docsA.content);

    //     // 从doc获取文本内容
    //     // let articleA_Text, articleB_Text = '';
    //     // if (docsA && docsA.content) {
    //     //     console.log('Entered the if statement');
    //     //     const result = await mammoth.extractRawText({ buffer: Buffer.from(docsA.content) });
    //     //     articleA_Text = result.value;
    //     //     console.log('articleA_Text:', articleA_Text);
    //     // }
    //     // if (docsB && docsB.content) {
    //     //     console.log('Entered the if statement');
    //     //     const result = await mammoth.extractRawText({ buffer: Buffer.from(docsB.content) });
    //     //     articleB_Text = result.value;
    //     //     console.log('articleB_Text:', articleB_Text);
    //     // }
    //     // const newPaper = {
    //     //     articleA_title: articleA_Text,
    //     //     articleB_title: articleB_Text,
    //     // };
    //     // // return newPaper
    //     // // 切换到articleA_title对应的知识库
    //     // const botId =
    //     //     (await this.userService.getBotIdByUserId(req.user.userId)).bot_id;

    //     // const nextLibraryId =
    //     //     (await this.articleRepository.find({ where: { id: articleAId } }))[
    //     //         0
    //     //     ].library_id;
    //     // console.log("nextLibraryId:", nextLibraryId);
    //     // // 切换知识库
    //     // const result = await this.chatService.changeSourceLibrary(
    //     //     botId,
    //     //     nextLibraryId,
    //     // );

    //     // 再次获取知识库，看看现在用的是什么知识库（library_id,articleTitle,paperId)
    //     // const newLibraryId = await this.chatService.fetchBotLibraryId(req.user.userId)
    //     const newPaperId = (await this.paperRepository.findOne({
    //         where: [
    //             { articleAId: articleAId },
    //             { articleBId: articleBId },
    //         ],
    //     })).id;
    //     const feedback = {
    //         // previousPaperScore: currentPaperScore,
    //         paperId: newPaperId, //paperId
    //         articleA: {
    //             title: articleA_title,
    //             content: articleA_Text,
    //         },
    //         articleB: {
    //             title: articleB_title,
    //             content: articleB_Text,
    //         },
    //         // result: result as boolean,
    //     };
    //     return feedback;
    // }

    @Get("/getPaperScore")
    async getPaperScore(
        @Req() req: {
            user: {
                id: number;
                userId: number;
                username: string;
            };
        },
    ): Promise<number> {
        // 知道现在的article ⬇️
        const progress = await this.paperService.getProgress(req.user.userId);
        console.log("currentArticle_id", progress.lastArticle);

        // 知道现在的paper ⬇️
        // const currentPaper_id = (await this.paperRepository.findOne({
        //     where: [
        //         { articleAId: currentArticle_id },
        //         { articleBId: currentArticle_id },
        //     ],
        // })).id;
        const answerSheet = await this.answersSheetRepository.findOneOrFail({
            where: {
                id: progress.currentAnserSheetID,
            },
            relations: { paper: true },
        });

        //👉 插入一个计算当前paper总分的函数并且把他录入对应答题卡
        const currentPaperScore = await this.paperService.getPaperScore(
            answerSheet.paper.id,
            req.user.userId,
        );
        return currentPaperScore;
    }
}
