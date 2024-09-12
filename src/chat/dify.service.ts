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

  public current_bot_config: {
    context_dbs: string[]
  } = {
      context_dbs: []
    }
  private logger = new Logger('DifyService');

  constructor(private dataSource: DataSource) {
    this.articleRepository = this.dataSource.getRepository(Dify);
    this.userRepository = this.dataSource.getRepository(User);
    this.fetchBotInfo()
  }

  // 发送对话消息
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
  // 发送对话消息- 执行方法
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
  //给获取当前用户的聊天历史记录
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
  //给获取当前用户的聊天历史记录-执行方法
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
  // 获取机器人信息(主要是为了获取机器人使用的知识库id)
  async fetchBotInfo() {
    try {
      // You should use await with fetch to handle the promise properly
      const response = await fetch("https://dify.cyte.site:2097/console/api/apps/a2ff7b15-cfc4-489d-96cf-307d33c43b00", {
        headers: {
          "accept": "*/*",
          "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
          "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMjE2ZWJiZDQtZDQxOS00NzkxLTg1YTktZTVmNDdmMDczNDIwIiwiZXhwIjoxNzI3NTc1MzI4LCJpc3MiOiJTRUxGX0hPU1RFRCIsInN1YiI6IkNvbnNvbGUgQVBJIFBhc3Nwb3J0In0.7zfonkN-SsEOO3CsVa2s_zU3uhOXsehE1qBGHaR-N_4",
          "cache-control": "no-cache",
          "content-type": "application/json",
          "pragma": "no-cache",
          "priority": "u=1, i",
          "sec-ch-ua": "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"Windows\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "Referer": "https://dify.cyte.site:2097/app/a2ff7b15-cfc4-489d-96cf-307d33c43b00/configuration",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        method: "GET"
      });

      // Check if the response was successful
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parse the JSON from the response
      const data = await response.json();
      const id = data.model_config.dataset_configs.datasets.datasets[0].dataset.id as string
      console.log('机器人知识库', id); // Log the data to the console
      console.log('终了'); // Log the data to the console
      return id
    } catch (error) {
      console.error('There was an error!', error);
    }
  }

  // 通过知识库id获取文章title
  async getArticleName(id: string) {
    try {
      // You should use await with fetch to handle the promise properly
      const response = await fetch(`https://dify.cyte.site:2097/console/api/datasets?page=1&ids=${id}`, {
        headers: {
          "accept": "*/*",
          "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
          "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMjE2ZWJiZDQtZDQxOS00NzkxLTg1YTktZTVmNDdmMDczNDIwIiwiZXhwIjoxNzI3NTc1MzI4LCJpc3MiOiJTRUxGX0hPU1RFRCIsInN1YiI6IkNvbnNvbGUgQVBJIFBhc3Nwb3J0In0.7zfonkN-SsEOO3CsVa2s_zU3uhOXsehE1qBGHaR-N_4",
          "cache-control": "no-cache",
          "content-type": "application/json",
          "pragma": "no-cache",
          "priority": "u=1, i",
          "sec-ch-ua": "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"Windows\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "Referer": "https://dify.cyte.site:2097/app/a2ff7b15-cfc4-489d-96cf-307d33c43b00/configuration",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        method: "GET"
      });

      // Check if the response was successful
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parse the JSON from the response
      const data = await response.json();
      const title = data.data[0].name
      return title
    } catch (error) {
      console.error('There was an error!', error);
    }
  }
  // .then(response => {
  //   console.log(response.json());
  //   return response.json();
  // }).then(json => {
  //   this.current_bot_config = json;
  // });
}

// async fetchBotInfo() {
//   // Fetch bot info

//   this.current_bot_config = {
//     context_dbs: []
//   }
// }