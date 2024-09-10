import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Article } from './article.entity';
import { CreateArticle } from './article.dto';

@Injectable()
export class ArticleService {
  private articleRepository;
  private logger = new Logger();
  //   inject the Datasource provider
  constructor(private dataSource: DataSource) {
    // get Article table repository to interact with the database
    this.articleRepository = this.dataSource.getRepository(Article);
  }
  // 注册文章
  async register(createArticleDto: CreateArticle) {
    const { title, content } = createArticleDto;
    const existArticle = await this.findByArticleTitle(title);
    if (existArticle) {
      throw new BadRequestException('注册文章已存在');
    }

    const article = createArticleDto

    return await this.create(article);
  }

  // 创建文章
  async create(article: CreateArticle) {
    const { title } = article;
    await this.articleRepository.save(article);
    return await this.articleRepository.findOne({
      where: { title },
    });
  }

  // 根据文章名搜索
  async findByArticleTitle(title: string): Promise<CreateArticle | undefined> {
    return await this.articleRepository.findOne({ where: { title } });
  }

  // 获取文章
  async getAllArticle(): Promise<Article[]> {
    try {
      const articles = await this.articleRepository.find();
      return articles;
    } catch (err) {
      this.logger.error(err.message, err.stack);
      throw new InternalServerErrorException('Failed to retrieve article');
    }
  }

    // 查询指定用户信息
    async getArticleById(title: string): Promise<Article> {
      try {
        const article = await this.articleRepository.findOneBy({ title });
        if (!article) {
          throw new NotFoundException(`Article with title ${title} not found`);
        }
        return article;
      } catch (err) {
        this.logger.error(
          `Failed to find Article by title ${title}: ${err.message}`,
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


