import { Module } from '@nestjs/common';
import { DifyController } from './dify.controller';
import { DifyService } from './dify.service';
import { ArticleService } from 'src/article/article.service';

@Module({
  providers: [DifyService,ArticleService],
  controllers: [DifyController]
})
export class DifyModule {}
