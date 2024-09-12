import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModule } from './database/typeorm.module';
import { UsersModule } from './users/users.module';
import { User } from './users/users.entity';
import { AuthModule } from './auth/auth.module';
import { ArticleModule } from './article/article.module';
import { DifyModule } from './chat/dify.module';

@Module({
  imports: [
    // TypeOrmModule.forRoot({
    //   type: 'mysql',
    //   host: 'localhost',
    //   port: 3306,
    //   username: 'root',
    //   password: 'sgy12345',
    //   database: 'lot',
    //   entities: [User],
    //   synchronize: true,
    // }),
    TypeOrmModule,
    UsersModule,
    AuthModule,
    ArticleModule,
    DifyModule
  ],
})
export class AppModule {}