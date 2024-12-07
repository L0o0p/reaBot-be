import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { AnswerSheetService } from './answer-sheet.service';
import { ArticleService } from 'src/article/article.service';
import { Repository } from 'typeorm';
import { Question } from './entities/questions.entity';
import { InjectRepository } from '@nestjs/typeorm';
// import { AuthGuard } from '@nestjs/passport';
import { DifyService } from 'src/chat/dify.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PaperService } from 'src/article/paper.service';
// import { SupplementalQuestion } from './entities/supplementalQuestion.entity';

@UseGuards(JwtAuthGuard)
@Controller('answer-sheet')
export class AnswerSheetController {
  constructor(
    private readonly answerSheetService: AnswerSheetService,
    private readonly paperService: PaperService,
    private readonly articleService: ArticleService,
    private readonly chatService: DifyService,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    // @InjectRepository(SupplementalQuestion)
    // private supplementalQuestion: Repository<SupplementalQuestion>,
    // @InjectRepository(AnswerSheet)
    // private answerSheetRepository: Repository<AnswerSheet>,
    // @InjectRepository(Paper)
    // private paperRepository: Repository<Paper>,
    // @InjectRepository(Answer)
    // private answerRepository: Repository<Answer>
  ) { }

  @Post('submit')
  // @UseGuards(AuthGuard('jwt'))
  async submitSingleAnswer(
    @Body() body: { answer: number, questionIndex: number },
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      }
    }
  ) {
    console.log('receviedAnswer:', body.answer);
    console.log('body:', body);
    console.log('req', req.user);
    const articleId = (await this.articleService.getPropertyArticle(req.user.userId)).id
    console.log('articleIdX', articleId);

    // 1. 从知识库获取此题正确答案
    // const matchQuestion = (await this.questionRepository.find({ where: { articleId: articleId, id: body.questionIndex } }))[0];
    // const correctAnswer = Number(matchQuestion.correctAnswer )
    const answerList: number[] = [2, 1, 2, 0, 3] // 从数据表拉取正确答案（传入「题号」questionIndex、「当前文章id」ariticle_id)
    const questionIndex: number = body.questionIndex
    const correctAnswer: number = answerList[questionIndex];
    const getCorrectAnswerLetter = (num: number): string => {
      switch (num) {
        case 0: return 'A';
        case 1: return 'B';
        case 2: return 'C';
        case 3: return 'D';
        default: return 'A';
      }
    }
    const CorrectAnswerLetter = getCorrectAnswerLetter(correctAnswer);
    console.log('correctAnswer', correctAnswer);
    // 录入用户答案及其正答情况

    // 2. 判断用户答案是否正确
    const isCorrect = (Number(body.answer) == Number(correctAnswer))
    console.log('isCorrect', isCorrect);
    const question = (await this.questionRepository.find({ where: { articleId: articleId } }))[questionIndex]
    const questionID = question.id
    console.log('questionID', questionID);

    // 3. 录入用户答案及其正答情况（无论对错）
    await this.answerSheetService.recordUserAnswer(
      body.answer,
      isCorrect,
      questionID, //这里是题号，从1开始计数，但是要传入的是questionid，应该是根据articleid和questionindex来找到这道题本身的id:
      articleId,
      req.user.userId
    )

    const additionalExercises = {
      question: "x. 提前设置好的跟踪题?",
      options: ["A. 香蕉 1", "B. 苹果 2", "C. 雪梨 3", "D. 菠萝 4"]

    };
    return { CorrectAnswerLetter, correct: isCorrect, additionalExercises }
  }

  @Post('analyze')
  async analyzeRecord(
    @Body() body: { answer: number, questionIndex: number },
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      }
    }
  ) {
    // const answerList: number[] = [2, 1, 2, 0, 3] // 从数据表拉取正确答案（传入「题号」questionIndex、「当前文章id」ariticle_id)
    const questionIndex: number = body.questionIndex
    // const correctAnswer: number = answerList[questionIndex];
    const articleId = (await this.articleService.getPropertyArticle(req.user.userId)).id
    const question = (await this.questionRepository.find({ where: { articleId: articleId } }))[questionIndex]
    // const questionID = question.id

    // 4. 如果答错
    console.log('Wrong');

    // const supplementalQuestions = await this.answerSheetService.findSupplementalQuestionByQuestionId(questionID)
    // const additionalExercises = {supplementalQuestions.question, supplementalQuestions.options}
    // const additionalAnswer = supplementalQuestions.correctAnswer
    // console.log( 'additionalExercises', additionalExercises);

    const questionString = question.question + question.options.join()
    const info = `对于这道题${questionString}，请根据文章内容，并严格依照本文的「练习题目」的答案和解析，给我150字以内的答案解析，帮助我理解和进步`
    console.log('req.user', req.user);

    const answerAnalysis = await this.chatService.sendInfo(info, req.user, true) || {
      answer: '答案解析：回答错误 ⛽️ 再接再厉'
    }
    // const answerAnalysis = (await this.chatService.sendInfo({ information: info }, req.user)).answer;//return { conversation_id, answer };
    // console.log( 'answerAnalysis', answerAnalysis);

    // const feedback = {
    //   // 返回正确答案（数据库）
    //   // correctAnswer: correctAnswer,
    //   // 答案解析（AI生成）
    //   answerAnalysis: answerAnalysis,
    //   // 返回一条追踪练习题（提前设置好）
    //   // additionalExercises: additionalExercises,
    //   // 补充问题的答案
    //   // additionalAnswer: additionalAnswer,
    // }
    return answerAnalysis
  }

  @Post('tttest')
  async Test(
    @Body() body: { answer: number, questionIndex: number },
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      }
    }
  ) {
    console.log('receviedAnswer:', body.answer);
    console.log('body:', body);
    console.log(req.user.userId);

    // 从当前知识库知道当前正在做的文章
    const articleId = (await this.articleService.getPropertyArticle(req.user.userId)).id
    console.log('articleIdX', articleId);

    // // 1. 从知识库获取此题正确答案
    // const matchQuestions = (await this.questionRepository.find({ where: { articleId: articleId } }))
    // const matchQuestion = matchQuestions[body.questionIndex]
    // const correctAnswer = matchQuestion.correctAnswer// 正确答案
    // console.log('对应跟踪题', matchQuestion);
    const answerList: number[] = [2, 1, 2, 0, 3] // 从数据表拉取正确答案（传入「题号」questionIndex、「当前文章id」ariticle_id)
    const questionIndex: number = body.questionIndex
    const correctAnswer: number = answerList[questionIndex];
    console.log('correctAnswer', correctAnswer);
    // 录入用户答案及其正答情况

    // 2. 判断用户答案是否正确
    const isCorrect = (Number(body.answer) == Number(correctAnswer))
    console.log('isCorrect', isCorrect);
    const questionID = (await this.questionRepository.find({ where: { articleId: articleId } }))[questionIndex].id
    console.log('questionID', questionID);

    // 3. 录入用户答案及其正答情况（无论对错）
    await this.answerSheetService.recordUserAnswer(
      body.answer,
      isCorrect,
      questionID, //这里是题号，从1开始计数，但是要传入的是questionid，应该是根据articleid和questionindex来找到这道题本身的id:
      articleId,
      req.user.userId
    )
    let returnBack = `提交了文章${articleId}的 - 第${questionIndex}题 -正确答案是${correctAnswer}，你的答案是${body.answer},所判断为${isCorrect ? '正确' : '错误'}`
    if (isCorrect) {
      console.log('Correct');
      return returnBack
    } else {
      // 4. 如果答错
      console.log('Wrong');
      return returnBack
    }
  }

  @Post('submitSupplemental')
  // @UseGuards(AuthGuard('jwt'))
  async submiSsubmitSupplementalAnswer(
    @Body() body: { answer: number, questionIndex: number },
    @Req() req: {
      user: {
        id: number;
        userId: number;
        username: string;
      }
    }
  ) {
    console.log('receviedAnswer:', body.answer);
    console.log('body:', body);
    console.log(req.user.userId);

    // 从当前知识库知道当前正在做的文章
    const articleId = (await this.articleService.getPropertyArticle(req.user.userId)).id
    console.log('articleIdX', articleId);

    // // 1. 从知识库获取此题正确答案
    // const matchQuestions = (await this.questionRepository.find({ where: { articleId: articleId } }))
    // const matchQuestion = matchQuestions[body.questionIndex]
    // const correctAnswer = matchQuestion.correctAnswer// 正确答案
    // console.log('对应跟踪题', matchQuestion);
    const answerList: number[] = [2, 1, 2, 0, 3] // 从数据表拉取正确答案（传入「题号」questionIndex、「当前文章id」ariticle_id)
    const questionIndex: number = body.questionIndex
    const correctAnswer: number = answerList[questionIndex];
    console.log('correctAnswer', correctAnswer);
    // 录入用户答案及其正答情况

    // 2. 判断用户答案是否正确
    const isCorrect = (Number(body.answer) == Number(correctAnswer))
    console.log('isCorrect', isCorrect);
    const questionID = (await this.questionRepository.find({ where: { articleId: articleId } }))[questionIndex].id
    console.log('questionID', questionID);

    // 3. 录入用户答案及其正答情况（无论对错）
    await this.answerSheetService.recordUserAnswer(
      body.answer,
      isCorrect,
      questionID, //这里是题号，从1开始计数，但是要传入的是questionid，应该是根据articleid和questionindex来找到这道题本身的id:
      articleId,
      req.user.userId
    )
    if (isCorrect) {
      console.log('Correct');
      return true
    } else {
      // 4. 如果答错
      console.log('Wrong');
      return false
    }
  }

  @Get('startAnswerPaper')
  async startPaper(@Req() req: {
    user: {
      id: number;
      userId: number;
      username: string;
    }
  }) {
    const nextPaper = await this.paperService.getNextPaper(req.user.userId);
    const paperId = nextPaper.id;

    try {
      let answerSheet = await this.answerSheetService.getAnswerSheetByPaperAndUserId(paperId, req.user.userId);

      if (answerSheet) {
        console.log('答题卡已存在，answerSheetId：', answerSheet.id);
        // 创建新对象来更新
        const updateData = {
          ...answerSheet,
          articleAStartedAt: new Date()
        };
        answerSheet = await this.answerSheetService.save(updateData);
      } else {
        answerSheet = await this.answerSheetService.createAnswerSheet(paperId, req.user.userId);
        console.log('答题卡不存在，创建新的答题卡answerSheetId：', answerSheet.id);
      }
      return answerSheet;
    } catch (error) {
      console.error('Error in startPaper:', error);
      throw error;
    }
  }

  @Get('startAnswerArticle')
  async startAnswerArticle(@Req() req: {
    user: {
      id: number;
      userId: number;
      username: string;
    }
  }) {
    try {
      const article = await this.articleService.getPropertyArticle(req.user.userId);
      const paper = await this.paperService.findPaperByAricleId(article.id);
      let answerSheet = await this.answerSheetService.getAnswerSheetByPaperAndUserId(paper.id, req.user.userId);

      if (!answerSheet) {
        throw new NotFoundException('Answer sheet not found');
      }

      // 创建新对象来更新
      const updateData = {
        ...answerSheet,
        articleBStartedAt: new Date()
      };
      answerSheet = await this.answerSheetService.save(updateData);

      return answerSheet;
    } catch (error) {
      console.error('Error in startAnswerArticle:', error);
      throw error;
    }
  }

}
