// src/app.module.ts

import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';

// Your Controllers and Services
import { AnswerSheetController } from './answer-sheet/answer-sheet.controller';
import { ArticleController } from './article/article.controller';  // Example
import { AnswerSheetService } from './answer-sheet/answer-sheet.service';
import { AnswerSheet } from './answer-sheet/entities/answer-sheet.entity';
import { Question } from './answer-sheet/entities/questions.entity';
import { SupplementalQuestion } from './answer-sheet/entities/supplementalQuestion.entity';
import { ArticleService } from './article/article.service';
import { DifyController } from './chat/dify.controller';
import { DifyService } from './chat/dify.service';
import { User } from './users/entity/users.entity';
import { Article } from './article/entities/article.entity';
import { Dify } from './chat/dify.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth/auth.controller';
import { UsersController } from './users/users.controller';
import { PaperController } from './article/paper.controller';
import { AuthService } from './auth/auth.service';
import { UsersService } from './users/users.service';
import { PaperService } from './article/paper.service';
import { JwtService } from '@nestjs/jwt';
import { Paper } from './article/entities/paper.entity';
import { Answer } from './answer-sheet/entities/answers.entity';
import { Database } from './database/typeorm.module';
import { DataSource } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { TextPreprocessorService } from './article/upload.service';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),
    Database,
    TypeOrmModule.forFeature([
      Article,
      File,
      Question, User,
      AnswerSheet,
      Paper,
      SupplementalQuestion,
      Answer,
      Dify,
    ]),
    AuthModule,
    HttpModule

  ],
  controllers: [
    ArticleController,
    DifyController,
    AuthController,
    UsersController,
    PaperController,
    AnswerSheetController,
  ],
  providers: [
    ArticleService,
    DifyService,
    AuthService,
    UsersService,
    PaperService,
    AnswerSheetService,
    JwtService,
    ConfigService,  // Register your implementation of ConfigService as a provider
    TextPreprocessorService
  ],
})
export class AppModule { }