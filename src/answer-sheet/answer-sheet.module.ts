import { Module } from '@nestjs/common';
import { AnswerSheetService } from './answer-sheet.service';
import { AnswerSheetController } from './answer-sheet.controller';

@Module({
  controllers: [AnswerSheetController],
  providers: [AnswerSheetService],
})
export class AnswerSheetModule {}
