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
import axios from 'axios';

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
  async register(createArticleDto: CreateArticle, library_id: string) {
    const { title, content } = createArticleDto;
    const existArticle = await this.findByArticleTitle(title);
    if (existArticle) {
      throw new BadRequestException('注册文章已存在');
    }
    const article = {
      ...createArticleDto,
      library_id: library_id, // 保存加密后的密码
    };


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
  // 创建dify知识库（空）
  async createLibrary(createArticleDto: CreateArticle) {
    const rootUrl = 'https://dify.cyte.site:2097/v1'
    const url = `${rootUrl}/datasets`
    const apiKey = 'dataset-9yaDOWXcbI2IkEP7OXobMTLg';  // 知识库密钥

    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: createArticleDto.title
      })
    };

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data; // 返回API响应数据
    } catch (error) {
      console.error('Error:', error);
      throw error; // 重新抛出错误允许调用者处理它
    }
  }
  // 在给定id的知识库中创建新文档
  async createLibraryArticle(id: string, createArticleDto: CreateArticle) {
    const datasetId = id; // Replace {dataset_id} with your actual dataset ID
    const apiKey = 'dataset-9yaDOWXcbI2IkEP7OXobMTLg'; // Replace {api_key} with your actual API key
    const rootUrl = 'https://dify.cyte.site:2097/v1'
    const url = `${rootUrl}/datasets/${datasetId}/document/create_by_text`;

    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": 'application/json'
      },
      body: JSON.stringify({
        name: createArticleDto.title,
        text: createArticleDto.content,
        indexing_technique: "high_quality",
        process_rule: { "mode": "automatic" }
      })
    };

    fetch(url, options)
      .then(response => response.json())
      .then(result => console.log(result))
      .catch(error => console.error('Error:', error));
  };
  async deletDifyLibrary(dataset_id: string) {
    const url = `http://dify.cyte.site/v1/datasets/${dataset_id}`
    const apiKey = 'dataset-9yaDOWXcbI2IkEP7OXobMTLg';
    const options = {
      method: 'DELET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": 'application/json'
      },
    };
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data; // 返回API响应数据
    } catch (error) {
      console.error('Error:', error);
      throw error; // 重新抛出错误允许调用者处理它
    }
  }
}


