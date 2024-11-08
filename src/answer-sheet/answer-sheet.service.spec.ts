import { Test, TestingModule } from '@nestjs/testing';
import { AnswerSheetService } from './answer-sheet.service';

describe('AnswerSheetService', () => {
  let service: AnswerSheetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnswerSheetService],
    }).compile();

    service = module.get<AnswerSheetService>(AnswerSheetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
