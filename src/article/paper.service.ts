import {
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import { DataSource, In, LessThan, LessThanOrEqual, Repository } from "typeorm";
import { Article } from "./entities/article.entity";
import { Paper } from "./entities/paper.entity";
import { ArticleService } from "./article.service";
import { Answer } from "src/answer-sheet/entities/answers.entity";
import { AnswerSheet } from "../answer-sheet/entities/answer-sheet.entity";
import { Question } from "src/answer-sheet/entities/questions.entity";
import { AnswerSheetService } from "src/answer-sheet/answer-sheet.service";
import { LatestArticle } from "./dto/paper.dto";
// interface MammothMessage {
//     type: string; // 'error' | 'warning' 等
//     message: string;
// }
// interface MammothTextResult {
//     value: string;
//     messages: MammothMessage[];
// }
// {
//     "id": 1,
//     "title": "The Importance of Water Conservation",
//     "content": "<h3>The Importance of Water Conservation</h3><p>Water is a crucial resource for all life on Earth, but it is becoming increasingly scarce due to factors like population growth, climate change, and environmental degradation. Water conservation is vital for ensuring sustainable water supplies for future generations. By implementing water-saving strategies in households, communities, and industries, we can significantly reduce water wastage and mitigate the effects of water scarcity.</p><p>Households can conserve water by fixing leaks, using water-efficient appliances, and employing water-saving techniques such as collecting rainwater for gardening. Communities can implement sustainable water management practices such as reusing treated wastewater for non-potable purposes like landscaping and industrial cooling.</p><p>Industries, particularly those that are water-intensive, can improve their water efficiency by upgrading to more efficient processes and equipment. Furthermore, raising awareness about the importance of water conservation can lead to broader community action and support for policies that promote sustainable water use.</p>",
//     "library_id": "d6235ab7-c36f-4b9f-9cef-6cf83482b850"
// }
type ArticleRes = {
    id: number;
    title: string;
    content: string;
    library_id: string;
};

@Injectable()
export class PaperService {
    private paperRepository: Repository<Paper>;
    private articleRepository: Repository<Article>;
    private questionsRepository: Repository<Question>;
    private answersRepository: Repository<Answer>;
    private answerSheetRepository: Repository<AnswerSheet>;
    private logger = new Logger();
    //   inject the Datasource provider
    constructor(
        private dataSource: DataSource,
        private articleService: ArticleService,
        private answerSheetService: AnswerSheetService,
    ) {
        this.paperRepository = this.dataSource.getRepository(Paper);
        this.articleRepository = this.dataSource.getRepository(Article);
        this.questionsRepository = this.dataSource.getRepository(Question);
        this.answersRepository = this.dataSource.getRepository(Answer);
        this.answerSheetRepository = this.dataSource.getRepository(AnswerSheet);
    }
    // 注册paper
    async createPaper(articleA_title, articleB_title) {
        const articleA_Id =
            (await this.articleService.getArticleByTitle(articleA_title)).id;
        const articleB_Id =
            (await this.articleService.getArticleByTitle(articleB_title)).id;

        const newPaper = {
            articleAId: articleA_Id, // 修改字段名以匹配数据库列名
            articleBId: articleB_Id, // 修改字段名以匹配数据库列名
            theme: articleA_title + " & " + articleB_title,
        };
        console.log("newPaper", newPaper);
        return await this.create(newPaper);
    }
    // 验证article是已否存在于paper表中
    async getArticleByTitle(article_title: string) {
        const existingArticle = await this.articleRepository.findOne({
            where: { title: article_title },
        });

        if (!existingArticle) {
            console.log("二次验证通过");
            return article_title;
        }
        throw new Error(`Article 「${article_title}」 already exists`);
    }

    // 通过title获取articleID

    // 保存文章到paper表中
    async create(newPaper) {
        if (!newPaper.articleAId || !newPaper.articleBId) {
            throw new Error("Article titles are required");
        }
        console.log("A:", newPaper.articleAId, ";", "B", newPaper.articleBId);

        const savedPaper = await this.paperRepository.save(newPaper);
        return savedPaper;
    }

    // 查询所有paper
    async getAllPaper() {
        return await this.paperRepository.find();
    }

    async getPaperById(id: number) {
        try {
            const article = await this.paperRepository.findOne({
                where: { id },
                relations: {
                    articleA: true,
                    articleB: true,
                },
            });
            if (!article) {
                throw new NotFoundException(`Article with id ${id} not found`);
            }
            return article;
        } catch (err) {
            this.logger.error(
                `Failed to find Article by title ${id}: ${err.message}`,
                err.stack,
            );
            if (err instanceof NotFoundException) {
                throw err;
            }
            throw new InternalServerErrorException(
                "Something went wrong, Try again!",
            );
        }
    }

    // async estimateTime(userId: number): Promise<any> {

    //     // 最近提交的答案
    //     console.log('estimateTime');
    //     // 根据该user最新的answer获取qustions
    //     console.log('userId', userId);
    //     // 找到本用户的答题卡
    //     const lastestAnswerSheet = await this.answerSheetRepository.findOne({
    //         where: { user: { id: userId } },
    //         order: { createdAt: 'DESC' },
    //         // select: ['id']
    //     })
    //     const lastestAnswerSheetId = lastestAnswerSheet.id
    //     console.log('lastestAnswerSheet', lastestAnswerSheetId);
    //     if (!lastestAnswerSheetId) { console.log('没有答案表'); return null; }
    //     // 找到本用户最近提交的答案
    //     const lastestAnswer = (await this.answersRepository.find({
    //         where: {
    //             answerSheet: { id: lastestAnswerSheetId }
    //         },
    //         relations: {
    //             question: true  // 明确加载question关联
    //         },
    //         order: {
    //             updatedAt: 'DESC'
    //         },
    //         take: 1
    //     }))[0]
    //     // 上一个文章的最后一个答案的提交
    //     // 上一个文章怎么知道 =》要知道当前的Paper & Article
    //     // 当前文章：lastAnswer =》questionsId =》Article
    //     if (!lastestAnswer || Object.keys(lastestAnswer).length === 0) { console.log('答案表上还没有填入任何答案，answer表没有数据'); return null; }
    //     const lastQuestion = lastestAnswer.question
    //     // 根据question获取article
    //     const lastestArticle = await this.articleRepository.findOne({
    //         where: {
    //             id: lastQuestion.articleId
    //         }
    //     })
    //     if (!lastestArticle) { console.log('没有找到对应的article'); return null; }
    //     const title = lastestArticle.title
    //     const articleId = lastestArticle.id
    //     console.log('title', title);
    //     console.log('articleId', articleId);
    //     // 根据article获取paper
    //     const lastestPaper = await this.paperRepository.findOne({
    //         where: [
    //             { articleA: { title } },
    //             { articleB: { title } }
    //         ]
    //     });
    //     if (!lastestPaper) { console.log('没有找到对应的paper'); return null; }
    //     console.log('lastestPaper', lastestPaper);
    //     // 查找上一篇文章的问题集合：
    //     const findLastArticleQuestions = async () => {
    //         // 先判断是articleA还是articleB
    //         let lastArticleIsAorB = ''
    //         // 如果现在是ArticleA，找上一Paper的ArticleB
    //         if (lastestPaper.articleAId === lastestArticle.id) {
    //             console.log('知道的 article 对象是 paper 的 articleA');
    //             // 那么上一篇就是 paper 的 articleB
    //             lastArticleIsAorB = 'B'
    //             // 找上一个Paper：将所有PaperId作为一个集合，找到所有Id比自己小的，然后排序，取最后一个
    //             const allPaperIds = await this.paperRepository.find({ select: ['id'] });
    //             const sortedPaperIds = allPaperIds.sort((a, b) => a.id - b.id);
    //             const lastPaperId = sortedPaperIds.find(p => p.id < lastestPaper.id);
    //             // 用上一个Paper的ArticleBId去查找问题
    //             const lastPaper = await this.paperRepository.findOne({ where: { id: lastPaperId.id } });
    //             const lastArticle = lastPaper.article;
    //             const lastArticleId = lastArticle.id;
    //             const lastArticleQuestions = await this.questionsRepository.find({ where: { articleId: lastArticleId } });
    //             return { lastArticleQuestions, lastArticleIsAorB }
    //         }
    //         // 如果现在是ArticleB，直接找上一篇文章
    //         else if (lastestPaper.articleBId === lastestArticle.id) {
    //             console.log('知道的 article 对象是 paper 的 articleB');
    //             // 那么上一篇就是 articleA
    //             lastArticleIsAorB = 'A'
    //             const lastArticleId = lastestPaper.articleBId
    //             const lastArticle = await this.articleRepository.findOne({
    //                 where: { id: lastArticleId },
    //                 relations: ['questions']
    //             });
    //             const lastArticleQuestions: [] = lastArticle.questions
    //             if (!lastArticle || !lastArticleQuestions) {
    //                 console.log('没有找到上一篇文章');
    //                 return null;
    //             }
    //             console.log('找到了', lastArticleQuestions);
    //             return { lastArticleQuestions, lastArticleIsAorB };
    //         } else {
    //             console.log('知道的 article 对象不在该 paper 中');
    //             return null
    //         }
    //     }
    //     const { lastArticleQuestions, lastArticleIsAorB } = await findLastArticleQuestions()
    //     // 获取这个集合的最后一个问题的答案的更新时间
    //     if (lastArticleQuestions && lastArticleQuestions.length > 0) {
    //         const lastOneQuestionOfLastArticle: Answer = lastArticleQuestions[lastArticleQuestions.length - 1]
    //         const answerOflastOneQuestionOfLastArticle = await this.answersRepository.findOne({
    //             where: {
    //                 question: { id: lastOneQuestionOfLastArticle.id }
    //             },
    //         });
    //         const startPoint = answerOflastOneQuestionOfLastArticle.updatedAt;
    //         const endPoint = lastestAnswer.updatedAt
    //         // return { endPoint, startPoint }
    //         const timeTaken: string = calculateTiming(startPoint, endPoint)
    //         this.recordTimeToken(timeTaken, lastArticleIsAorB, lastestAnswerSheetId)

    //         return timeTaken
    //     }
    // }

    // 计算文章阅读时间
    // 触发时机：当用户提交答案时，触发这个函数
    async estimateTime(
        currentAnserSheetID: number,
        lastArticleID: number,
    ): Promise<any> {
        // const answerSheet = await this.answerSheetService
        //     .getAnswerSheetByPaperAndUserId(paperId, userId);
        const answerSheet = await this.answerSheetRepository.findOneOrFail({
            where: { id: currentAnserSheetID },
            relations: { paper: true },
        });
        // 取articleAStartedAt、articleAFinishedAt
        const articleAStartedAt = answerSheet.articleAStartedAt;
        // const articleAFinishedAt = answerSheet.articleAFinishedAt;
        this.answerSheetRepository.save(answerSheet);
        // return answerSheet;
        // 计算时间差
        // const startPoint = articleAStartedAt;
        // return { endPoint, startPoint }
        const timeTaken: string = calculateTiming(articleAStartedAt);
        const lastArticleIsAorB =
            lastArticleID === answerSheet.paper.articleAId ? "A" : "B";
        await this.recordTimeToken(timeTaken, lastArticleIsAorB, answerSheet);

        return timeTaken;
    }

    async recordTimeToken(
        timeTaken: string,
        lastArticleIsAorB: string,
        answerSheet: AnswerSheet,
    ): Promise<AnswerSheet> {
        if (lastArticleIsAorB === "A") {
            answerSheet.articleATimeToken = timeTaken;
        } else {
            answerSheet.articleBTimeToken = timeTaken;
        }
        return this.answerSheetRepository.save(answerSheet);
    }

    async getProgress(userId: number): Promise<undefined | LatestArticle> {
        // 根据该user最新的answer获取qustions
        const answerSheet = await this.answerSheetRepository.findOne({
            where: {
                user: { id: userId },
            },
            order: {
                id: "DESC",
            },
            relations: {
                paper: {
                    articleA: true,
                    articleB: true,
                },
            },
        });
        if (!answerSheet) {
            return undefined;
        }
        const answers = await this.answersRepository.find({
            where: {
                answerSheet: { id: answerSheet.id },
            },
            relations: {
                question: true, // 明确加载question关联
                answerSheet: true,
            },
            order: {
                question: {
                    id: "ASC", // 按question.id升序排列
                },
            },
        });

        let lastAnswer: Answer | null;
        const currentAnserSheetID = answerSheet.id;
        if (answers.length > 0) {
            lastAnswer = answers[0];
            const lastQuestion = lastAnswer.question;
            const lastArticle = await this.articleRepository.findOne({
                where: {
                    id: lastQuestion.articleId,
                },
            });
            const title = lastArticle.title;
            // ====================计算这出这是这篇文章的第几题========================================

            let currentQuestionNum = await this.questionsRepository.count({
                where: {
                    articleId: lastQuestion.articleId,
                    id: LessThanOrEqual(lastQuestion.id),
                },
            });
            // =======================================================================================
            let currentArticleKey = "";
            // if (paper) {
            if (answerSheet.paper.articleA?.title === title) {
                currentArticleKey = "A";
            } else {
                currentArticleKey = "B";
            }
            // ==================== 获取某篇 lastArticle 下的总题目数量。=============================
            const totalQuestionCount = await this.questionsRepository
                .createQueryBuilder("question")
                .where("question.articleId = :articleId", {
                    articleId: lastArticle.id,
                })
                .getCount();
            // ============= 如果对应题目是本文最后一题，应该变更原来的currentArticleKey。===================
            if (currentQuestionNum === totalQuestionCount) {
                if (currentArticleKey === "A") {
                    currentArticleKey = "B";
                    currentQuestionNum += 1; // 下一题
                } else {
                    currentArticleKey = "A";
                }
                currentQuestionNum = 1; // 到下一篇的第一题
            }
            return {
                currentArticleKey,
                currentQuestionNum,
                currentAnserSheetID,
                lastArticle,
                lastPaperID: answerSheet.paper.id,
            };
        } else {
            return {
                currentArticleKey: "A",
                currentQuestionNum: 0,
                currentAnserSheetID,
                lastArticle: answerSheet.paper.articleA,
                lastPaperID: answerSheet.paper.id,
            };
        }

        // 根据article 切换library
        // const libraryId = lastArticle.library_id
        // const botId = (await this.userService.getBotIdByUserId(userId)).bot_id;
        // const changeLibrary = await this.chatSheetService.changeSourceLibrary(botId,libraryId);
        // return  libraryId
        // return botId
        // return changeLibrary
    }

    async getCurrentPaper(userId: number, anserSheetID?: number): Promise<{
        paperId: number;
        articleA: ArticleRes;
        articleB: ArticleRes;
        // answerSheetID: number;
    }> {
        anserSheetID = anserSheetID ??
            (await this.getProgress(userId)).currentAnserSheetID;
        const currentAnserSheet = await this.answerSheetRepository
            .findOneOrFail({
                where: {
                    id: anserSheetID,
                },
                relations: {
                    paper: {
                        articleA: true,
                        articleB: true,
                    },
                },
            });
        // console.log("newPaper", currentPaper);
        // const paperId = currentPaper.id;
        // const articleA = (await this.articleRepository.find({
        //     where: { id: currentPaper.articleAId },
        // }))[0];
        // const articleB = (await this.articleRepository.find({
        //     where: { id: currentPaper.articleBId },
        // }))[0];
        // 3. 返回paper信息和当前文章信息
        return {
            // answerSheetID: currentAnserSheet.id,
            paperId: currentAnserSheet.paper.id,
            articleA: currentAnserSheet.paper.articleA,
            articleB: currentAnserSheet.paper.articleB,
        };
    }

    async getPaperScore(paperId: number, userId: number) {
        // 使用事务来确保数据一致性
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 使用单次查询获取 paper 信息
            const paper = await queryRunner.manager.findOne(Paper, {
                where: { id: paperId },
                select: ["id", "articleAId", "articleBId"],
            });

            if (!paper) {
                throw new NotFoundException("Paper not found");
            }

            const { articleAId, articleBId } = paper;

            // 使用 SELECT FOR UPDATE 锁定行，防止并发问题
            let answerSheet = await queryRunner.manager.findOne(AnswerSheet, {
                where: {
                    paper: { id: paperId },
                    user: { id: userId },
                },
                lock: { mode: "pessimistic_write" },
            });

            if (!answerSheet) {
                answerSheet = queryRunner.manager.create(AnswerSheet, {
                    paper: { id: paperId },
                    user: { id: userId },
                    articleAStartedAt: new Date(),
                    totalScore: 0,
                });
                answerSheet = await queryRunner.manager.save(
                    AnswerSheet,
                    answerSheet,
                );
            }

            // 优化查询，一次性获取所有问题
            const [questionsA, questionsB] = await Promise.all([
                queryRunner.manager.find(Question, {
                    where: { articleId: articleAId },
                    select: ["id"],
                }),
                queryRunner.manager.find(Question, {
                    where: { articleId: articleBId },
                    select: ["id"],
                }),
            ]);

            // 一次性获取所有答案
            const allQuestionIds = [...questionsA, ...questionsB].map((q) =>
                q.id
            );
            const answers = await queryRunner.manager.find(Answer, {
                where: {
                    question: { id: In(allQuestionIds) },
                    answerSheet: { id: answerSheet.id },
                },
            });

            // 计算分数
            const totalScore = answers.filter((answer) =>
                answer.isCorrect
            ).length;

            // 更新总分
            answerSheet.totalScore = totalScore;
            await queryRunner.manager.save(AnswerSheet, answerSheet);

            // 提交事务
            await queryRunner.commitTransaction();
            return totalScore;
        } catch (error) {
            // 如果出错，回滚事务
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            // 释放查询运行器
            await queryRunner.release();
        }
    }

    async findLibraryIdByPaperId(paperId: number): Promise<string | undefined> {
        const paper = await this.paperRepository.findOne({
            where: { id: paperId },
            relations: ["articleA"], // 确保加载了关联的ArticleA实体
        });

        return paper?.articleA?.library_id; // 返回字符串类型的libraryId
    }

    // Add this function in your paper.service.ts
    async getPaperWithSmallestId(): Promise<number> {
        // const minId = await this.paperRepository.createQueryBuilder("paper")
        //     .select("MIN(paper.id)", "minId")
        //     .getRawOne();

        // Then, retrieve the paper with the minimum id
        const result = await this.paperRepository.findOne({
            where: {}, // 空对象作为条件
            order: { id: "ASC" }, // 按 id 升序排序，确保获取第一条记录
        });
        return result.id;
    }

    async findNextMinId(currentId: number): Promise<number | null> {
        const result = await this.paperRepository
            .createQueryBuilder("paper")
            .select("paper.id")
            .where("paper.id > :currentId", { currentId })
            .orderBy("paper.id", "ASC")
            .limit(1)
            .getOne();

        return result ? result.id : null;
    }

    // 接收请求 查询即将开始的试卷
    async getNextPaper(lastPaperID?: number) {
        // 知道现在的article ⬇️
        // const currentArticle_id =
        //     (await this.articleService.getPropertyArticle(userId)).id;
        // // 知道现在的paper ⬇️
        // const currentPaper_id = (await this.paperRepository.findOne({
        //     where: [
        //         { articleAId: currentArticle_id },
        //         { articleBId: currentArticle_id },
        //     ],
        // })).id;
        // const progress = await this.getProgress(userId);
        let nextPaperId;
        if (lastPaperID) {
            nextPaperId = await this.findNextMinId(lastPaperID);
        } else {
            nextPaperId = await this.getPaperWithSmallestId();
        }

        // 推算出下一个paper的id ⬇️
        // 推算出下一个paper的articleA ⬇️
        // 先把所有paper拿出来做成一个列表
        // const paperList = await this.getAllPaper();
        // console.log("paperList", paperList);
        // 设定规则，如果没有下一个就选择最初的paper
        // 拿到下一个paper对象
        const nextPaper = await this.getPaperById(nextPaperId);
        return nextPaper;
    }

    async findPaperB(paperID: number) {
        return this.paperRepository.findOneOrFail({
            where: {
                id: paperID,
            },
            relations: {
                articleB: true,
            },
        });
    }
}

const calculateTiming = (startPoint) => {
    const endDate = new Date();
    const startDate = new Date(startPoint);
    const timeDiff = endDate.getTime() - startDate.getTime(); // 以毫秒为单位

    const totalSeconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const timeTaken = ` 本文耗时：${minutes} 分 ${seconds} 秒`;
    console.log("timeTaken", timeTaken);

    return timeTaken;
};
