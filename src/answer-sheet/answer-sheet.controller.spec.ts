import { Test, TestingModule } from '@nestjs/testing';
import { AnswerSheetController } from './answer-sheet.controller';
import { AnswerSheetService } from './answer-sheet.service';

describe('AnswerSheetController', () => {
  let controller: AnswerSheetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnswerSheetController],
      providers: [AnswerSheetService],
    }).compile();

    controller = module.get<AnswerSheetController>(AnswerSheetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
