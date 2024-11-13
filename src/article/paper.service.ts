import {
    BadRequestException,
    HttpException,
    HttpStatus,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { DataSource, getRepository } from 'typeorm';
import { Article } from './entities/article.entity';
import { CreateArticle, CreatePaper } from './article.dto';
import { response } from 'express';
import { log } from 'console';
import { DifyService } from 'src/chat/dify.service';
import axios from 'axios';
import * as fs from 'fs';
import * as mammoth from 'mammoth';
import { DocFile } from './entities/docFile.entity';
import { Paper } from './entities/paper.entity';
import { ArticleService } from './article.service';
import { Answer } from 'src/answer-sheet/entities/answers.entity';
import { AnswerSheet } from 'src/answer-sheet/entities/answer-sheet.entity';
import { Question } from 'src/answer-sheet/entities/questions.entity';
import { AnswerSheetService } from 'src/answer-sheet/answer-sheet.service';
interface MammothMessage {
    type: string; // 'error' | 'warning' 等
    message: string;
}
interface MammothTextResult {
    value: string;
    messages: MammothMessage[];
}
@Injectable()
export class PaperService {
    private paperRepository;
    private articleRepository;
    private questionsRepository;
    private answersRepository;
    private answerSheetRepository;
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
        const articleA_Id = (await this.articleService.getArticleByTitle(articleA_title)).id;
        const articleB_Id = (await this.articleService.getArticleByTitle(articleB_title)).id;

        const newPaper = {
            articleAId: articleA_Id,  // 修改字段名以匹配数据库列名
            articleBId: articleB_Id,  // 修改字段名以匹配数据库列名
            theme: articleA_title + " & " + articleB_title,
        };
        console.log('newPaper', newPaper);
        return await this.create(newPaper);
    }
    // 验证article是已否存在于paper表中
    async getArticleByTitle(article_title: string) {
        const existingArticle = await this.paperRepository.findOne({
            where: { title: article_title },
        });

        if (!existingArticle) {
            console.log('二次验证通过');
            return article_title;
        }
        throw new Error(`Article 「${article_title}」 already exists`);
    };

    // 通过title获取articleID

    // 保存文章到paper表中
    async create(newPaper) {
        if (!newPaper.articleAId || !newPaper.articleBId) {
            throw new Error('Article titles are required');
        }
        console.log('A:', newPaper.articleAId, ';', 'B', newPaper.articleBId);

        const savedPaper = await this.paperRepository.save(newPaper);
        return savedPaper;
    }

    // 查询所有paper
    async getAllPaper() {
        return await this.paperRepository.find();
    }

    async getPaperById(id: number) {
        try {
            const article = await this.paperRepository.findOneBy({ id });
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
                'Something went wrong, Try again!',
            );
        }
    }

    async getCurrentPaper() {
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

    async getPaperScore(paperId: number, userId: number) {
        // const articleId = 2;
        // const answerSheetId = 2;
        // 取得paperId
        console.log('userId', userId);
        console.log('paperId', paperId);
        // 取得paperId对下的两篇文章的articleId
        const articleAId = (await this.paperRepository.find({ where: { id: paperId } }))[0].articleAId;
        const articleBId = (await this.paperRepository.find({ where: { id: paperId } }))[0].articleBId;
        console.log('articleIdX', articleAId, articleBId);

        let answerSheet = await this.answerSheetRepository.findOne({
            where: { paper: { id: paperId }, user: { id: userId } },
        });
        console.log('answerSheetX',answerSheet);
        if (!answerSheet) {
            answerSheet = this.answerSheetService.CreateAnswerSheet(paperId,userId)
        }
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
        this.answerSheetRepository.update({ id: answerSheetId }, { totalScore: totalScore });// 更新答案表的分数
        return totalScore;

    }

    async findLibraryIdByPaperId(paperId: number): Promise<string | undefined> {
    const paper = await this.paperRepository.findOne({
      where: { id: paperId },
      relations: ['articleA'],  // 确保加载了关联的ArticleA实体
    });

    return paper?.articleA?.library_id;  // 返回字符串类型的libraryId
  }
}
