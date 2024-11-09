import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AnswerSheetService } from './answer-sheet.service';
import { CreateAnswerSheetDto } from './dto/create-answer-sheet.dto';
import { UpdateAnswerSheetDto } from './dto/update-answer-sheet.dto';
import { ArticleService } from 'src/article/article.service';
import { Repository } from 'typeorm';
import { Question } from './entities/questions.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Controller('answer-sheet')
export class AnswerSheetController {
  constructor(private readonly answerSheetService: AnswerSheetService,
    private readonly articleService: ArticleService,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>
  ) { }

  @Post('submit')
  async submitSingleAnswer(@Body() body: { answer: number, questionIndex: number }) {
    console.log('receviedAnswer:', body.answer);
    console.log('body:', body);
    const articleId = (await this.articleService.getPropertyArticle()).id
    const matchQuestion = (await this.questionRepository.find({ where: { articleId: articleId, id: body.questionIndex } }))[0];
    const correctAnswer = Number(matchQuestion.correctAnswer )
    console.log('correctAnswer', correctAnswer);
    
    // const answerList: number[] = [2, 1, 2, 0, 3] // 从数据表拉取正确答案（传入「题号」questionIndex、「当前文章id」ariticle_id)
    // const correctAnswer: number = answerList[index];
    const index: number = body.questionIndex
    if (body.answer === correctAnswer) {
      console.log('Correct');
      return true
    } else {
      console.log('Wrong');
      return false
    }
  }

  @Post()
  create(@Body() createAnswerSheetDto: CreateAnswerSheetDto) {
    return this.answerSheetService.create(createAnswerSheetDto);
  }

  @Get()
  findAll() {

    return this.answerSheetService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.answerSheetService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAnswerSheetDto: UpdateAnswerSheetDto) {
    return this.answerSheetService.update(+id, updateAnswerSheetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.answerSheetService.remove(+id);
  }
}
