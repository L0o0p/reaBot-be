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
import { response } from 'express';
import { log } from 'console';
import { DifyService } from 'src/chat/dify.service';

@Injectable()
export class ArticleService {
  private articleRepository;
  private logger = new Logger();
  //   inject the Datasource provider
  constructor(
    private dataSource: DataSource,
    private chatService: DifyService
  ) {
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

  // 查询指定文章信息
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

  // 获取dify知识库
  async fetchDifyLibrary() {
    const url = 'https://dify.cyte.site:2097/v1/datasets?page=1&limit=20';
    // curl --location --request GET 'http://dify.cyte.site/v1/datasets/{dataset_id}/documents' \
    // --header 'Authorization: Bearer {api_key}'
    const apiKey = 'dataset-9yaDOWXcbI2IkEP7OXobMTLg'//知识库的key
    try {
      // 使用 fetch 发送 GET 请求
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      // 检查响应状态
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 解析 JSON 数据
      const data = await response.json();
      console.log(data); // 在控制台输出获取的数据
      return data
    } catch (error) {
      console.error('There was an error!', error);
      if (response) {
        console.log("Response status:", response.status);
      }
    }
  }
  // 获取dify知识库文档列表
  async fetchDifyLibraryFiles() {
    const library_id = await this.chatService.fetchBotInfo() as unknown as string
    // const dataset_id = '2cf5d66d-a3fe-481e-9619-3b0a4d688e94'//<英文短文> 知识库的id
    const url = `https://dify.cyte.site:2097/v1/datasets/${library_id}/documents`
    const apiKey = 'dataset-9yaDOWXcbI2IkEP7OXobMTLg'//知识库的key
    try {
      // 使用 fetch 发送 GET 请求
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      // 检查响应状态
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 解析 JSON 数据
      const data = await response.json(); //完整数据
      const data_name = data.data[0].data_source_detail_dict.upload_file.name //所求文档名字
      return data_name
    } catch (error) {
      console.error('There was an error!', error);
      if (response) {
        console.log("Response status:", response.status);
      }
    }
  }
  // 从dify知识库文档列表获取(名字 -> 本地搜索获取)文档文本{name,content}
  async getPropertyArticle() {
    const articleName = await this.fetchDifyLibraryFiles()
    const article_name = articleName.split('.')[0];
    const propertyArticle = this.getArticleById(article_name)
    return propertyArticle
  }
}


