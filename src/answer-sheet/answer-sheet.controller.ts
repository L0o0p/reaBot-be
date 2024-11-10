import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { AnswerSheetService } from './answer-sheet.service';
import { CreateAnswerSheetDto } from './dto/create-answer-sheet.dto';
import { UpdateAnswerSheetDto } from './dto/update-answer-sheet.dto';
import { ArticleService } from 'src/article/article.service';
import { Repository } from 'typeorm';
import { Question } from './entities/questions.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AnswerSheet } from './entities/answer-sheet.entity';
import { Paper } from 'src/article/entities/paper.entity';
import { Answer } from './entities/answers.entity';
import { AuthGuard } from '@nestjs/passport';
import { DifyService } from 'src/chat/dify.service';

@Controller('answer-sheet')
export class AnswerSheetController {
  private readonly chatService: DifyService
  constructor(private readonly answerSheetService: AnswerSheetService,
    private readonly articleService: ArticleService,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    // @InjectRepository(AnswerSheet)
    // private answersheetRepository: Repository<AnswerSheet>,
    // @InjectRepository(Paper)
    // private paperRepository: Repository<Paper>,
    // @InjectRepository(Answer)
    // private answerRepository: Repository<Answer>
  ) { }

  @Post('submit')
  @UseGuards(AuthGuard('jwt'))
  async submitSingleAnswer(
    @Body() body: { answer: number, questionIndex: number },
    @Req() req: any & { user: { id: number, username: string } }
  ) {
    console.log('receviedAnswer:', body.answer);
    console.log('body:', body);
    const articleId = (await this.articleService.getPropertyArticle()).id
    console.log('articleIdX', articleId);

    // 1. 从知识库获取此题正确答案
    // const matchQuestion = (await this.questionRepository.find({ where: { articleId: articleId, id: body.questionIndex } }))[0];
    // const correctAnswer = Number(matchQuestion.correctAnswer )
    const answerList: number[] = [2, 1, 2, 0, 3] // 从数据表拉取正确答案（传入「题号」questionIndex、「当前文章id」ariticle_id)
    const questionIndex: number = body.questionIndex
    const correctAnswer: number = answerList[questionIndex];
    console.log('correctAnswer', correctAnswer);
    // 录入用户答案及其正答情况

    // 2. 判断用户答案是否正确
    const isCorrect = body.answer === correctAnswer
    console.log('isCorrect', isCorrect);
    const questionID =( await this.questionRepository.find({ where: { articleId: articleId } }))[questionIndex].id
    console.log( 'questionID', questionID);
    
    // 3. 录入用户答案及其正答情况（无论对错）
    await this.answerSheetService.recordUserAnswer(
      body.answer,
      isCorrect,
      questionID, //这里是题号，从1开始计数，但是要传入的是questionid，应该是根据articleid和questionindex来找到这道题本身的id:
      articleId,
      req.user.userId
    )
    return
    if (isCorrect) {
      console.log('Correct');
      return true
    } else {
      // 4. 如果答错
      console.log('Wrong');
      const additionalExercises = '提前设置好的追踪练习'
      const info = '答错了，继续努力吧'
      const answerAnalysis =(await this.chatService.sendInfo({information: info}, req.user));//return { conversation_id, answer };
      const feedback = {
        // 返回正确答案（数据库）
        correctAnswer: correctAnswer,
        // 答案解析（AI生成）
        answerAnalysis: answerAnalysis,
        // 返回一条追踪练习题（提前设置好）
        additionalExercises: additionalExercises
      }
      return feedback
    }
  }

}
