import { PartialType } from '@nestjs/mapped-types';
import { CreateAnswerSheetDto } from './create-answer-sheet.dto';

export class UpdateAnswerSheetDto extends PartialType(CreateAnswerSheetDto) {}
