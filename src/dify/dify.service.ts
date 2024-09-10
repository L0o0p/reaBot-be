import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Dify } from './dify.entity';
import { information } from './dify.dto';
import axios from 'axios';

@Injectable()
export class DifyService {
  private articleRepository;
  private logger = new Logger('DifyService');

  constructor(private dataSource: DataSource) {
    this.articleRepository = this.dataSource.getRepository(Dify);
  }

  async sendInfo(info: information) {
    const url = 'https://dify.cyte.site:2097/v1/chat-messages';
    const apiKey = 'app-8rXZUovD1x6yBACSZBW9JICy';  // 使用正确的API密钥
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    let cvsId = '50053539-0426-4213-bd1e-6644c45ce0f9';  // 初始化 conversation_id
    const body = {
      inputs: {},
      query: info.information,  // 确保这里是正确的信息字段
      response_mode: "blocking",
      conversation_id: '',
      user: "abc-123",
    };

    // 等待 postData 方法返回结果
    const { conversation_id, answer } = await this.postData(url, body, headers);
    cvsId = conversation_id
    // 根据业务需求调整返回值
    return { cvsId ,answer};
  }

  async postData(url, body, headers) {
    try {
      const response = await axios.post(url, body, { headers });
      console.log('Success:', response.data.conversation_id);
      return {
        conversation_id: response.data.conversation_id,
        answer: response.data.answer
      };  
    } catch (error) {
      console.error('Error:', error.message);
      console.error('信息没有成功发送到dify服务器');
      throw new InternalServerErrorException('无法发送信息到 Dify 服务器');
    }
  }
}


