import { Injectable } from '@nestjs/common';
import { CreateAnswerSheetDto } from './dto/create-answer-sheet.dto';
import { UpdateAnswerSheetDto } from './dto/update-answer-sheet.dto';

@Injectable()
export class AnswerSheetService {
  create(createAnswerSheetDto: CreateAnswerSheetDto) {
    return 'This action adds a new answerSheet';
  }

  findAll() {
    return `This action returns all answerSheet`;
  }

  findOne(id: number) {
    return `This action returns a #${id} answerSheet`;
  }

  update(id: number, updateAnswerSheetDto: UpdateAnswerSheetDto) {
    return `This action updates a #${id} answerSheet`;
  }

  remove(id: number) {
    return `This action removes a #${id} answerSheet`;
  }
}
