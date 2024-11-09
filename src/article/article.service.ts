import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, getRepository, Repository } from 'typeorm';
import { Article } from './entities/article.entity';
import { CreateArticle } from './article.dto';
import { response } from 'express';
import { log } from 'console';
import { DifyService } from 'src/chat/dify.service';
import axios from 'axios';
import * as fs from 'fs';
import * as mammoth from 'mammoth';
import { DocFile } from './entities/docFile.entity';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from 'src/answer-sheet/entities/questions.entity';
interface MammothMessage {
  type: string; // 'error' | 'warning' 等
  message: string;
}
interface MammothTextResult {
  value: string;
  messages: MammothMessage[];
}
@Injectable()
export class ArticleService {
  private articleRepository;
  private docFileRepository;
  private questionRepository;
  private logger = new Logger();
  private difyDatabaseKey: string;
  private DIFY_URL: string;
  private difyUserToken: string;
  //   inject the Datasource provider
  constructor(
    private dataSource: DataSource,
    private chatService: DifyService,
    private configService: ConfigService
  ) {
    // get Article table repository to interact with the database
    this.articleRepository = this.dataSource.getRepository(Article);
    this.docFileRepository = this.dataSource.getRepository(DocFile);
    this.questionRepository = this.dataSource.getRepository(Question);
    this.difyDatabaseKey = this.configService.get<string>('DIFY_DATABASE_KEY');
    this.DIFY_URL = this.configService.get<string>('DIFY_URL');
    this.difyUserToken = this.configService.get<string>('DIFY_USER_TOKEN');

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
      library_id: library_id,
    };
    return await this.create(article);
  }

  // 追加提示内容
  //  传入：提示内容，当前使用的文章的title
  async addTips(current_article_title: string, tips: string[]) {
    const existArticle = await this.findByArticleTitle(current_article_title);
    if (existArticle) {
      const article = {
        ...existArticle,
        tips: tips,
      };
      return await this.create(article);
    }
  }

  // 获取当前文章的tips内容


  // 创建文章
  async create(article: CreateArticle) {
    if (!article.title) {
      throw new HttpException('Article title is required', HttpStatus.BAD_REQUEST);
    }
    await this.articleRepository.save(article);
    return this.articleRepository.findOne({
      where: { title: article.title },
    });
  }

  // 根据文章名搜索
  async findByArticleTitle(title: string): Promise<CreateArticle | undefined> {
    return await this.articleRepository.findOne({ where: { title } });
  }

    // 根据文章名搜索
  async findByArticleId(id): Promise<CreateArticle | undefined> {
    return await this.articleRepository.findOne({ where: { id } });
  }
  // 根据文章名搜索
  async findByDocTag(tag: string): Promise<string> {
    return await this.docFileRepository.findOne({ where: { tag } });
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
  async getArticleByTitle(title: string): Promise<Article> {
    try {
      console.log('tilte', title);
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
  
  // 查询指定文章doc
  async getArticleDocByTitle(title: string) {
    const getDocFilesByArticleTitle = async (title: string) => {
      const docFiles = await this.docFileRepository
        .createQueryBuilder('docFile')
        .innerJoinAndSelect('docFile.article', 'article', 'article.title = :title', { title })
        .getMany();
      // console.log('docFiles:', typeof docFiles, '\n', docFiles);
      const acticle_docFiles = filterByTag(docFiles, 'article')
      return acticle_docFiles;
    }
    const filterByTag = async (docFiles, tag) => {
      // 使用 filter 方法筛选数组
      return docFiles.filter(docFile => docFile.tag === tag);
    }
    return getDocFilesByArticleTitle(title)
  }
  // 查询指定文章的问题doc
  async getQuestionsDocByTitle(title: string) {
    const getDocFilesByArticleTitle = async (title: string) => {
      const docFiles = await this.docFileRepository
        .createQueryBuilder('docFile')
        .innerJoinAndSelect('docFile.article', 'article', 'article.title = :title', { title })
        .getMany();
      const questions_docFiles = filterByTag(docFiles, 'questions')
      console.log('questions_docFiles:', questions_docFiles);
      return questions_docFiles;
    }
    const filterByTag = async (docFiles, tag) => {
      // 使用 filter 方法筛选数组
      return docFiles.filter(docFile => docFile.tag === tag);
    }
    return getDocFilesByArticleTitle(title)
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
    const library_id = (await this.chatService.fetchBotInfo()).model_config.dataset_configs.datasets.datasets[0].dataset.id
    // const dataset_id = '312d5b8b-53d2-4ae9-8648-caab17550427'//<英文短文> 知识库的id
    const url = `${this.DIFY_URL}/datasets/${library_id}/documents`
    const apiKey = this.difyDatabaseKey//知识库的key
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
      console.log('dataX',data);
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
    console.log( 'articleNameX', articleName);
    
    const article_name = articleName.split('.')[0];
    const propertyArticle = this.getArticleByTitle(article_name)
    return propertyArticle
  }
  // 创建dify知识库（空）
  async createLibrary(article_title: string) {
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
        name: article_title
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
      .then(result => console.log('result:', result))
      .catch(error => console.error('Error:', error));
  };
  // async deletDifyLibrary(dataset_id: string) {
  //   const url = `http://dify.cyte.site/v1/datasets/${dataset_id}`
  //   const apiKey = 'dataset-9yaDOWXcbI2IkEP7OXobMTLg';
  //   const options = {
  //     method: 'DELET',
  //     headers: {
  //       Authorization: `Bearer ${apiKey}`,
  //       "Content-Type": 'application/json'
  //     },
  //   };
  //   try {
  //     const response = await fetch(url, options);
  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }
  //     const data = await response.json();
  //     return data; // 返回API响应数据
  //   } catch (error) {
  //     console.error('Error:', error);
  //     throw error; // 重新抛出错误允许调用者处理它
  //   }
  // }

  // 通过接收前端的doc文档创建dify知识库
  async createLibraryByDoc(file: Express.Multer.File, id: string) {
    const datasetId = id
    const apiKey = 'dataset-9yaDOWXcbI2IkEP7OXobMTLg';
    const form = new FormData();
    // 将 JSON 对象转换为字符串并添加到 FormData
    const jsonData = JSON.stringify({
      indexing_technique: 'high_quality',
      process_rule: {
        rules: {
          pre_processing_rules: [
            { id: 'remove_extra_spaces', enabled: true },
            { id: 'remove_urls_emails', enabled: true }
          ],
          segmentation: {
            separator: '###',
            max_tokens: 500
          }
        },
        mode: 'custom'
      }
    });
    form.append('data', jsonData);
    // const r = file.buffer.buffer;
    // file to blob
    const blob = new Blob([file.buffer.buffer], { type: 'application/json' });

    form.append('file', blob, file.originalname);

    try {
      const response = await axios.post(`https://dify.cyte.site:2097/v1/datasets/${datasetId}/document/create_by_file`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${apiKey}`
        }
      });
      console.log('Success:', response.data);
    } catch (error: any) {
      console.error('Error:', error.response ? error.response.data : error.message);
    }
    return true
  }

  //接收前端doc文档并且读取
  async uploadFileToRead(file: Express.Multer.File) {
    try {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      const textResult: MammothTextResult = {
        value: result.value,
        messages: result.messages.map(msg => ({
          type: msg.type,
          message: msg.message
        }))
      };
      return textResult.value;
    } catch (error) {
      throw new HttpException('Error processing file', HttpStatus.BAD_REQUEST);
    }
  }
  //接收前端doc文档并存储在本地数据库
  async save_articleFile(file: Express.Multer.File, id: string, tag: string): Promise<File> {
    const match_article = file.originalname.split('.')[0]; // 用doc名称命名
    console.log('match_article:', match_article);
    let existArticle = await this.findByArticleTitle(match_article);
    if (!existArticle) {
      console.log('不存在同名文章');
      const article = {
        title: match_article || 'article_created_by_doc',
        content: 'created by doc',
        library_id: id
      };
      existArticle = await this.create(article);
      console.log('创建文章成功');
    }
    console.log('existArticle:', existArticle);
    console.log("tag:", tag);

    // 存在的话直接在link中创建
    const newFile = this.docFileRepository.create({
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
      content: file.buffer,
      article: existArticle,
      tag: tag
    });
    console.log('newFile:', newFile);

    return this.docFileRepository.save(newFile);
  }

  //接收前端doc文档并存储在本地数据库
  async save_attachFile(file: Express.Multer.File, tag: string): Promise<File> {
    const match_article = file.originalname.split('.')[0]; // 用doc名来搜索存在的同名文章
    console.log('match_article:', match_article);
    let existArticle = await this.findByArticleTitle(match_article);
    if (!existArticle) {
      console.log('不存在同名文章');
      return
      // const article = {
      //   title: match_article || 'article_created_by_doc',
      //   content: 'created by doc',
      // };
      // existArticle = await this.create(article);
      // console.log('创建文章成功');
    }
    console.log('existArticle:', existArticle);
    console.log("tag:", tag);

    // 存在的话直接在link中创建
    const newFile = this.docFileRepository.create({
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
      content: file.buffer,
      article: existArticle,
      tag: tag
    });
    console.log('newFile:', newFile);

    return this.docFileRepository.save(newFile);
  }


  async getDocumentByNameAndTag(name: string, tag: string): Promise<string[] | null> {
    const document = await this.docFileRepository.findOne({ where: { name, tag } });
    if (document && document.content) {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(document.content) });
      const  rawText = result.value;
      console.log('Document found', rawText);
      const splitStringByNewLine = (input: string): string[] => {
        // 使用正则表达式来同时匹配 \n 和 \r\n
        return input.split(/\r?\n/).filter(line => line !== '');
      }
      const lines = splitStringByNewLine(rawText);
      console.log('lines', lines);
      return lines
    } else {
      console.log('No document found with the provided name and tag.');
      return null;
    }
  }

  async convertLettersToNumbers(array:string[]) {
    // 定义转换规则，每个字母对应一个数字
    const mapping = {
        'A': 0,
        'B': 1,
        'C': 2,
        'D': 3
    };

    // 使用 map 方法通过查找 mapping 对象来转换数组中的每个元素
    return array.map(item => mapping[item]);
  }
  
  async getQuestionsByArticleID(article_id: number) {
    const questions = await this.questionRepository.find({ where: { articleId: article_id } });
    console.log('questions', questions);
    return questions
  }

}


