import { Module } from '@nestjs/common';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { DifyModule } from 'src/chat/dify.module';
import { DifyService } from 'src/chat/dify.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { PaperController } from './paper.controller';
import { PaperService } from './paper.service';
import { Paper } from './entities/paper.entity';
import { Question } from 'src/answer-sheet/entities/questions.entity';
import { Answer } from 'src/answer-sheet/entities/answers.entity';
import { AnswerSheet } from 'src/answer-sheet/entities/answer-sheet.entity';

@Module({
  providers: [ArticleService, DifyService, PaperService],
  controllers: [ArticleController, PaperController],
  imports: [DifyModule, TypeOrmModule.forFeature([Article, File, Paper,Question,Answer,AnswerSheet])]// 
})
export class ArticleModule { }
