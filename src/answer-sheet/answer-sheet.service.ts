import { Injectable, Logger } from '@nestjs/common';
import { CreateAnswerSheetDto } from './dto/create-answer-sheet.dto';
import { UpdateAnswerSheetDto } from './dto/update-answer-sheet.dto';
import { DataSource, Repository } from 'typeorm';
import { Answer } from './entities/answers.entity';
import { AnswerSheet } from './entities/answer-sheet.entity';
import { Paper } from 'src/article/entities/paper.entity';
import { DifyService } from 'src/chat/dify.service';
import { information } from 'src/chat/dify.dto';

@Injectable()
export class AnswerSheetService {
  private answerRepository: Repository<Answer>;
  private answersheetRepository: Repository<AnswerSheet>;
  private paperRepository: Repository<Paper>;
  private logger = new Logger('AnswerSheetService');

  constructor(
    private dataSource: DataSource,
  ) {
    this.answerRepository = this.dataSource.getRepository(Answer);
    this.answersheetRepository = this.dataSource.getRepository(AnswerSheet);
    this.paperRepository = this.dataSource.getRepository(Paper);
  }

  // 录入学生提交的成绩，如果答题卡不存在就先创建一个答题卡
  async recordUserAnswer(answerText:number, isCorrect:boolean, questionId:number,articleId:number, userId:number) {
    const paperId = (await this.paperRepository.find({
      where: [
        { articleAId: articleId },
        { articleBId: articleId }
      ]
    }))[0].id
    console.log('paperIdX', paperId);
    console.log('userId',userId);
    
    // const answerSheetId = 1
    const answerSheet = (await this.answersheetRepository.find({ where: { paper: { id: paperId }, user: { id: userId } } })) ;
    if(answerSheet && answerSheet.length > 0){
      console.log('answerSheetIdRight:', answerSheet);
      const answerSheetId = answerSheet[0].id;
    const userAnswer = {
      answerText: answerText,
      isCorrect: isCorrect,
      question: { id: questionId },
      answerSheet: { id: Number(answerSheetId) },
    }
    console.log('userAnswer',userAnswer);
    
    return await this.answerRepository.save(userAnswer)
}else{ 
      await this.CreateAnswerSheet(paperId, userId);
      const answerSheetId = (await this.answersheetRepository.find({ where: { paper: { id: paperId }, user: { id: userId } } }))[0].id;
    console.log('answerSheetIdX:', answerSheetId);
      const userAnswer = {
      answerText: answerText,
      isCorrect: isCorrect,
      question: { id: questionId },
      answerSheet: { id: Number(answerSheetId) },
    }
    return await this.answerRepository.save(userAnswer)
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

}
