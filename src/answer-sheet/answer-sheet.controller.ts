import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AnswerSheetService } from './answer-sheet.service';
import { CreateAnswerSheetDto } from './dto/create-answer-sheet.dto';
import { UpdateAnswerSheetDto } from './dto/update-answer-sheet.dto';

@Controller('answer-sheet')
export class AnswerSheetController {
  constructor(private readonly answerSheetService: AnswerSheetService) {}

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
