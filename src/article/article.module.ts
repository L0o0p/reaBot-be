import { Module } from '@nestjs/common';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';

@Module({
    providers: [ArticleService],
    controllers: [ArticleController]
  })
  export class ArticleModule {
    import: [];
  }
  