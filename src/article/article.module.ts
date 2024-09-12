import { Module } from '@nestjs/common';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { DifyModule } from 'src/chat/dify.module';
import { DifyService } from 'src/chat/dify.service';

@Module({
    providers: [ArticleService,DifyService],
    controllers: [ArticleController],
    imports: [DifyModule]
  })
  export class ArticleModule {}
  