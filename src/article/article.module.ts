import { Module } from '@nestjs/common';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { DifyModule } from 'src/chat/dify.module';
import { DifyService } from 'src/chat/dify.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';

@Module({
    providers: [ArticleService,DifyService],
    controllers: [ArticleController],
    imports: [DifyModule,TypeOrmModule.forFeature([Article, File])]// 
  })
  export class ArticleModule {}
  