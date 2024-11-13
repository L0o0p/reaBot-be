import { Module } from '@nestjs/common';
import { TypeOrmModule } from './database/typeorm.module';
import { ConfigModule } from '@nestjs/config';
import { DifyController } from './chat/dify.controller';
import { AnswerSheetService } from './answer-sheet/answer-sheet.service';
import { ArticleService } from './article/article.service';
import { DifyService } from './chat/dify.service';
import { UsersService } from './users/users.service';
import { AnswerSheetController } from './answer-sheet/answer-sheet.controller';
import { ArticleController } from './article/article.controller';
import { AuthController } from './auth/auth.controller';
import { UsersController } from './users/users.controller';
import { AuthService } from './auth/auth.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  providers: [UsersService, DifyService, ArticleService, AnswerSheetService,AuthService,JwtService],
  controllers:[DifyController,AnswerSheetController,ArticleController,AuthController,UsersController],
  imports: [
    TypeOrmModule,
    ConfigModule.forRoot({
      isGlobal: true,  // 这使所有模块都能访问环境变量
      envFilePath: '.env',  // 指定环境变量文件的路径
      expandVariables: true,  // 允许在 .env 文件中展开已有的环境变量
    }),
  ],
})
export class AppModule {}