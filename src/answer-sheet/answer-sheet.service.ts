import { Injectable, Logger } from '@nestjs/common';
import { CreateAnswerSheetDto } from './dto/create-answer-sheet.dto';
import { UpdateAnswerSheetDto } from './dto/update-answer-sheet.dto';
import { DataSource, Repository } from 'typeorm';
import { Answer } from './entities/answers.entity';
import { AnswerSheet } from './entities/answer-sheet.entity';
import { Paper } from 'src/article/entities/paper.entity';
import { DifyService } from 'src/chat/dify.service';
import { information } from 'src/chat/dify.dto';
import { Question } from './entities/questions.entity';

@Injectable()
export class AnswerSheetService {
  private answerRepository: Repository<Answer>;
  private answersheetRepository: Repository<AnswerSheet>;
  private paperRepository: Repository<Paper>;
  private questionRepository: Repository<Question>;
  private logger = new Logger('AnswerSheetService');

  constructor(
    private dataSource: DataSource,
  ) {
    this.answerRepository = this.dataSource.getRepository(Answer);
    this.answersheetRepository = this.dataSource.getRepository(AnswerSheet);
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
    let answerSheets = await this.answersheetRepository.find({
        where: { paper: { id: paperId }, user: { id: userId } }
    });

    // Create an answersheet if none exists
    if (!answerSheets.length) {
        await this.CreateAnswerSheet(paperId, userId);
        answerSheets = await this.answersheetRepository.find({
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
        await this.answerRepository.save(existingAnswer);
        console.log('Updated existing answer.');
    } else {
        // Create a new answer record
        const userAnswer = {
            answerText: answerText,
            isCorrect: isCorrect,
            question: { id: questionId },
            answerSheet: { id: answerSheetId }
        };
        await this.answerRepository.save(userAnswer);
        console.log('Created new answer.');
    }
}

  // 新建答题卡
  async CreateAnswerSheet(paperId: number, userId: number) {
    const answerSheet = {
      paper: { id: paperId },
      user: { id: userId },
    }
    return await this.answersheetRepository.save(answerSheet)
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

}
