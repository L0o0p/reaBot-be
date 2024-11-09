import { Body, Controller, Delete, Get, HttpException, HttpStatus, InternalServerErrorException, Param, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticle, CreatePaper } from './article.dto';
import { Article } from './entities/article.entity';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { DifyService } from 'src/chat/dify.service';
import { PaperService } from './paper.service';
import { DataSource } from 'typeorm';
import { Paper } from './entities/paper.entity';
import * as mammoth from 'mammoth';
import { get } from 'http';



@UseGuards(JwtAuthGuard)
@Controller('paper')
export class PaperController {
    logger: any;
    constructor(
        private readonly articleService: ArticleService,
        private readonly paperService: PaperService,
        private dataSource: DataSource,
    ) {
    }
    // 创建试卷（从前端获取title）
    @Post('create')
    async createPaper(@Body() createArticleDto: CreatePaper) {
        const articleA_title = createArticleDto.titles[0];
        const articleB_title = createArticleDto.titles[1];
        console.log('articleA_title:', articleA_title);
        console.log('articleB_title:', articleB_title);
        // 验证articleA_title和articleB_title是否为空以及是否重复
        if (!articleA_title || !articleB_title) {
            return { message: '文章标题不能为空' };
        }
        if (articleA_title === articleB_title) {
            return { message: '同一片文章不能被绑定在统一轮次' };
        }
        console.log('初次验证通过');
        // 调用paperService的createPaper方法
        const paper = await this.paperService.createPaper(articleA_title, articleB_title);
        return createArticleDto;
    }

    // 获取所有paper

    @Get('all')
    async getAllPaper() {
        const allPaper = await this.paperService.getAllPaper();

        // 使用 Promise.all 来等待所有异步操作完成
        const paperList = await Promise.all(allPaper.map(async paper => {
            const articleAId = paper.articleAId;
            const articleBId = paper.articleBId;
            const articleA_title = (await this.articleService.findByArticleId(articleAId)).title;
            const articleB_title = (await this.articleService.findByArticleId(articleBId)).title;
            const newPaper = {
                id: paper.id,
                articleA_title: articleA_title,
                articleB_title: articleB_title,
            };
            return newPaper;
        }));

        console.log('paperListX:', paperList);

        return paperList;
    }

    @Get(':id')
    async getPaperById(@Param('id') id: number): Promise<any> {
        // 拿到paper对象
        const paper = await this.paperService.getPaperById(id);
        // 从对象获取title
        const articleAId = paper.articleAId;
        const articleBId = paper.articleBId;
        const articleA_title = (await this.articleService.findByArticleId(articleAId)).title;
        const articleB_title = (await this.articleService.findByArticleId(articleBId)).title;
        // 从对象获取doc
        const docsA = (await this.articleService.getArticleDocByTitle(articleA_title))[0];
        const docsB = (await this.articleService.getArticleDocByTitle(articleB_title))[0];
        console.log(docsA.content);
        // 从doc获取文本内容
        let articleA_Text, articleB_Text = '';
        if (docsA && docsA.content) {
            console.log('Entered the if statement');
            const result = await mammoth.extractRawText({ buffer: Buffer.from(docsA.content) });
            articleA_Text = result.value;
            console.log('articleA_Text:', articleA_Text);
        }
        if (docsB && docsB.content) {
            console.log('Entered the if statement');
            const result = await mammoth.extractRawText({ buffer: Buffer.from(docsB.content) });
            articleB_Text = result.value;
            console.log('articleB_Text:', articleB_Text);
        }
        const newPaper = {
            id: id,
            articleA_title: articleA_Text,
            articleB_title: articleB_Text,
        };
        return newPaper
    }


}