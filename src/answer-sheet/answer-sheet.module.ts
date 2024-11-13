// import { forwardRef, Module } from '@nestjs/common';
// import { AnswerSheetService } from './answer-sheet.service';
// import { AnswerSheetController } from './answer-sheet.controller';
// import { Article } from 'src/article/entities/article.entity';
// import { Question } from './entities/questions.entity';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { ArticleModule } from 'src/article/article.module';
// import { ArticleService } from 'src/article/article.service';
// import { ArticleController } from 'src/article/article.controller';
// import { DifyModule } from 'src/chat/dify.module';
// import { DifyService } from 'src/chat/dify.service';
// import { DifyController } from 'src/chat/dify.controller';
// import { AnswerSheet } from './entities/answer-sheet.entity';
// import { Paper } from 'src/article/entities/paper.entity';
// import { SupplementalQuestion } from './entities/supplementalQuestion.entity';

// @Module({
//   controllers: [AnswerSheetController,ArticleController,DifyController],
//   providers: [AnswerSheetService,ArticleService,DifyService],
//   imports: [DifyModule, forwardRef(() => ArticleModule), TypeOrmModule.forFeature([Article, File,Question,AnswerSheet,Paper,SupplementalQuestion])]// 
// })
// export class AnswerSheetModule {}
