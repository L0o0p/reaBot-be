import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModule } from './database/typeorm.module';
import { UsersModule } from './users/users.module';
import { User } from './users/users.entity';
import { AuthModule } from './auth/auth.module';
import { ArticleModule } from './article/article.module';
import { DifyModule } from './chat/dify.module';
import { LockModule } from './lock/lock.module';
import { ConfigModule } from '@nestjs/config';
import { AnswerSheetModule } from './answer-sheet/answer-sheet.module';

@Module({
  imports: [
    TypeOrmModule,
    UsersModule,
    AuthModule,
    ArticleModule,
    DifyModule,
    LockModule,
    AnswerSheetModule,
    ConfigModule.forRoot({
      isGlobal: true,  // 这使所有模块都能访问环境变量
      envFilePath: '.env',  // 指定环境变量文件的路径
      expandVariables: true,  // 允许在 .env 文件中展开已有的环境变量
    }),
  ],
})
export class AppModule {}