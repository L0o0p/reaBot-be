import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Dify } from './dify.entity';
import { User } from 'src/users/users.entity';
import { information } from './dify.dto';
import axios from 'axios';
import { get } from 'http';

@Injectable()
export class DifyService {
  private articleRepository;
  private userRepository: Repository<User>;
  private logger = new Logger('DifyService');

  constructor(private dataSource: DataSource) {
    this.articleRepository = this.dataSource.getRepository(Dify);
    this.userRepository = this.dataSource.getRepository(User);
  }

  async sendInfo(info: information, user: { userId: number, username: string }) {
    // userId -> User
    const user_found = await this.userRepository.findOne({ where: { id: user.userId } });
    console.log('user_found', user_found);
    const url = 'https://dify.cyte.site:2097/v1/chat-messages';
    const apiKey = 'app-8rXZUovD1x6yBACSZBW9JICy';  // 使用正确的API密钥
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };

    const userID = `readbotuser-${user.userId}`
    let cid = user_found.conversation_id || '';
    const body = {
      inputs: {},
      query: info.information,  // 确保这里是正确的信息字段
      response_mode: "blocking",
      conversation_id: cid,
      user: userID,
    };
    console.log(JSON.stringify(body, null, 2));

    // 等待 postData 方法返回结果
    const { conversation_id, answer } = await this.postData(url, body, headers);
    this.updateUserConversation(conversation_id, user_found)
    // 根据业务需求调整返回值
    return { conversation_id, answer };
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


  // 给用户创建新的conversation_id
  async updateUserConversation(cvsId: string, user: User): Promise<void> {
    try {
      user.conversation_id = cvsId;
      await this.userRepository.save(user);
    } catch (error) {
      this.logger.error(`Error updating user with conversation ID: ${error.message}`);
      throw new InternalServerErrorException('更新用户对话ID失败');
    }
  }
  async getChatlog(user: { userId: number, username: string }) {
    // userId -> User
    console.log('id', user.userId);
    const user_found = await this.userRepository.findOne({ where: { id: user.userId } });
    console.log('user_found', user_found);
    const userID = `readbotuser-${user.userId}`

    const username = userID
    const conversationId = user_found.conversation_id; // 如果 conversation_id 有具体值，请填写在这里
    console.log('找到对应的conversationId', conversationId);
    const url = `https://dify.cyte.site:2097/v1/messages?user=${username}&conversation_id=${conversationId}&limit=100&first_id=`;
    const apiKey = 'app-8rXZUovD1x6yBACSZBW9JICy'; // Replace 'YOUR_API_KEY' with your actual API key
    return this.fetchData(url, apiKey)

  }

  async fetchData(url, apiKey) {
    return fetch(url, {
      method: 'GET', // 指定请求方法为 GET
      headers: {
        'Authorization': `Bearer ${apiKey}` // 设置授权头，使用提供的 API 密钥
      }
    })
      .then(response => {
        if (!response.ok) {
          // 如果响应状态码不是 2xx，抛出一个错误
          throw new Error('Network response was not ok');
        }
        return response.json(); // 解析 JSON 数据
      })
      .catch(error => {
        console.error('There was a problem with your fetch operation:', error); // 在控制台输出可能出现的错误
        throw error; // 将错误向上抛出，以便调用者可以处理
      });
  }
}