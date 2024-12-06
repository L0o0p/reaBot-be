import { Injectable, Logger } from '@nestjs/common';
import { CreateAnswerSheetDto } from './dto/create-answer-sheet.dto';
import { UpdateAnswerSheetDto } from './dto/update-answer-sheet.dto';
import { DataSource, Repository } from 'typeorm';
import { Answer } from './entities/answers.entity';
import { AnswerSheet } from './entities/answer-sheet.entity';
import { Paper } from '.././article/entities/paper.entity';
import { Question } from './entities/questions.entity';

@Injectable()
export class AnswerSheetService {
  private answerRepository: Repository<Answer>;
  private answerSheetRepository: Repository<AnswerSheet>;
  private paperRepository: Repository<Paper>;
  private questionRepository: Repository<Question>;
  private logger = new Logger('AnswerSheetService');

  constructor(
    private dataSource: DataSource,
  ) {
    this.answerRepository = this.dataSource.getRepository(Answer);
    this.answerSheetRepository = this.dataSource.getRepository(AnswerSheet);
    this.paperRepository = this.dataSource.getRepository(Paper);
    this.questionRepository = this.dataSource.getRepository(Question);
  }

  // 录入学生提交的成绩，如果答题卡不存在就先创建一个答题卡
  async recordUserAnswer(answerText: number, isCorrect: boolean, questionId: number, articleId: number, userId: number) {
    // Retrieve the paper ID based on article ID
    const papers = await this.paperRepository.find({
      where: [
        { articleAId: articleId },
        { articleBId: articleId }
      ]
    });
    if (!papers.length) {
      throw new Error('No paper found for the given article ID');
    }
    const paperId = papers[0].id;
    console.log('paperId:', paperId);
    console.log('userId:', userId);

    // Retrieve the answersheet for the user and paper
    let answerSheets = await this.answerSheetRepository.find({
      where: { paper: { id: paperId }, user: { id: userId } }
    });
    console.log("answerSheetsX", answerSheets);


    // Create an answersheet if none exists
    if (!answerSheets.length) {
      await this.createAnswerSheet(paperId, userId);
      answerSheets = await this.answerSheetRepository.find({
        where: { paper: { id: paperId }, user: { id: userId } }
      });
    }

    const answerSheetId = answerSheets[0].id;
    console.log('answerSheetId:', answerSheetId);

    // Check if an answer already exists with the given questionId and answersheetId
    const existingAnswer = await this.answerRepository.findOne({
      where: {
        question: { id: questionId },
        answerSheet: { id: answerSheetId }
      }
    });

    if (existingAnswer) {
      // Update the existing answer
      existingAnswer.answerText = answerText;
      existingAnswer.isCorrect = isCorrect;
      existingAnswer.ifTracking = isCorrect ? true : false
      await this.answerRepository.save(existingAnswer);
      console.log('Updated existing answer.');
    } else {
      // Create a new answer record
      const userAnswer = {
        answerText: answerText,
        isCorrect: isCorrect,
        question: { id: questionId },
        ifTracking: isCorrect ? true : false,
        answerSheet: { id: answerSheetId }
      };
      await this.answerRepository.save(userAnswer);
      console.log('Created new answer.');
    }
  }

  // 新建答题卡
  async createAnswerSheet(paperId: number, userId: number) {
    const answerSheet = this.answerSheetRepository.create({
      paper: { id: paperId },
      user: { id: userId },
      articleAStartedAt: new Date()
    });

    return await this.answerSheetRepository.save(answerSheet)
  }

  async findSupplementalQuestionByQuestionId(questionId: number) {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
      relations: ['supplementalQuestion'], // 确保加载关联的 SupplementalQuestion
    });

    if (question) {
      return question.supplementalQuestion;
    } else {
      return null; // 没有找到对应的 Question 或 SupplementalQuestion
    }
  }

  async getAnswerSheetByPaperAndUserId(paperId: number, userId: number) {
    return await this.answerSheetRepository
      .createQueryBuilder('answerSheet')
      .where('answerSheet.paper.id = :paperId', { paperId })
      .andWhere('answerSheet.user.id = :userId', { userId })
      .cache(true) // 启用查询缓存
      .getOne();
  }

  async findLatestAnswerSheet(userId: number): Promise<AnswerSheet | undefined> {
    return this.answerSheetRepository.findOne({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      relations: ['user', 'paper', 'answers'], // 加载关联实体，视具体需求而定
    });
  }

  async checkFollowPapers(userId: number) {
  }

  async createStartTime() {
    return
  }

  async save(answerSheet: AnswerSheet) {
    const mergedAnswerSheet = this.answerSheetRepository.merge(
      new AnswerSheet(),
      answerSheet
    );
    return this.answerSheetRepository.save(mergedAnswerSheet);
  }


}
