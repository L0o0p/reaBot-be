import {
    BadRequestException,
    HttpException,
    HttpStatus,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { DataSource, getRepository } from 'typeorm';
import { Article } from './entities/article.entity';
import { CreateArticle, CreatePaper } from './article.dto';
import { response } from 'express';
import { log } from 'console';
import { DifyService } from 'src/chat/dify.service';
import axios from 'axios';
import * as fs from 'fs';
import * as mammoth from 'mammoth';
import { DocFile } from './entities/docFile.entity';
import { Paper } from './entities/paper.entity';
import { ArticleService } from './article.service';
interface MammothMessage {
    type: string; // 'error' | 'warning' 等
    message: string;
}
interface MammothTextResult {
    value: string;
    messages: MammothMessage[];
}
@Injectable()
export class PaperService {
    private paperRepository;
    private logger = new Logger();
    //   inject the Datasource provider
    constructor(
        private dataSource: DataSource,
        private articleService: ArticleService,
    ) {
        this.paperRepository = this.dataSource.getRepository(Paper);
    }
    // 注册paper
async createPaper(articleA_title, articleB_title) {
    const articleA_Id = (await this.articleService.getArticleByTitle(articleA_title)).id;
    const articleB_Id = (await this.articleService.getArticleByTitle(articleB_title)).id;

    const newPaper = {
        articleAId: articleA_Id,  // 修改字段名以匹配数据库列名
        articleBId: articleB_Id,  // 修改字段名以匹配数据库列名
        theme: articleA_title + " & " + articleB_title,
    };
    console.log('newPaper', newPaper);
    return await this.create(newPaper);
}
    // 验证article是已否存在于paper表中
    async getArticleByTitle(article_title: string) {
        const existingArticle = await this.paperRepository.findOne({
            where: { title: article_title },
        });
 
        if (!existingArticle) {
            console.log('二次验证通过');
            return article_title;
        }
        throw new Error(`Article 「${article_title}」 already exists`);
    };

    // 通过title获取articleID

    // 保存文章到paper表中
    async create(newPaper) {
        if (!newPaper.articleAId || !newPaper.articleBId) {
            throw new Error('Article titles are required');
        }
        console.log('A:',newPaper.articleAId,';','B',newPaper.articleBId);
        
        const savedPaper = await this.paperRepository.save(newPaper);
        return savedPaper;
    }

    // 查询所有paper
    async getAllPaper() {
        return await this.paperRepository.find();
    }

    async getPaperById(id: number) {
   try {
      const article = await this.paperRepository.findOneBy({ id });
      if (!article) {
        throw new NotFoundException(`Article with id ${id} not found`);
      }
      return article;
    } catch (err) {
      this.logger.error(
        `Failed to find Article by title ${id}: ${err.message}`,
        err.stack,
      );
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException(
        'Something went wrong, Try again!',
      );
    }
    }
}
