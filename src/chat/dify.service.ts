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
import { ConfigService } from '@nestjs/config';

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
  private difyUserToken: string;

  constructor(
    private dataSource: DataSource,
    private configService: ConfigService
  ) {
    this.articleRepository = this.dataSource.getRepository(Dify);
    this.userRepository = this.dataSource.getRepository(User);
    this.difyUserToken = this.configService.get<string>('DIFY_USER_TOKEN');
    // this.fetchBotInfo()
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
  async fetchBotLibraryId() {
    try {
      // You should use await with fetch to handle the promise properly
      const botID = 'a2ff7b15-cfc4-489d-96cf-307d33c43b00'
      const response = await fetch(`https://dify.cyte.site:2097/console/api/apps/${botID}`, {
        headers: {
          "accept": "*/*",
          "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
          "authorization": `Bearer ${this.difyUserToken}`,
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
          "authorization": `Bearer ${this.difyUserToken}`,
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
        console.log('not ok');
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Parse the JSON from the response
      const data = await response.json();
      const title = data.data[0].name
      const library_id = data.data[0].id
      return { title, library_id }
    } catch (error) {
      console.error('There was an error!', error);
    }
  }
  // 获取机器人信息(获取机器人id)
  async fetchBotInfo() {
    try {
      // You should use await with fetch to handle the promise properly
      const response = await fetch("https://dify.cyte.site:2097/console/api/apps/a2ff7b15-cfc4-489d-96cf-307d33c43b00", {
        headers: {
          "accept": "*/*",
          "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
          "authorization": `Bearer ${this.difyUserToken}`,
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
      console.log('机器人信息', data); // Log the data to the console
      console.log('终了'); // Log the data to the console
      return data
    } catch (error) {
      console.error('There was an error!', error);
    }
  }
  // 更改机器人使用的知识库
  async changeSourceLibrary(bot_Id: string, switchLibraryId: string) {
    const url = `https://dify.cyte.site:2097/console/api/apps/${bot_Id}/model-config`;
    const a  = this.difyUserToken

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "accept": "*/*",
          "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
          "authorization": `Bearer ${a}`,
          "cache-control": "no-cache",
          "content-type": "application/json",
          "pragma": "no-cache",
          "priority": "u=1, i",
          "sec-ch-ua": "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"Windows\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin"
        },
        body: JSON.stringify({
          pre_prompt: "现在你是一个中国小学生的英文阅读理解题目讲解老师，向你提问的用户都是你教授的小学生，请你仅根据提供的英文短文内容以及小学生对你的提问进行题目和语法知识的讲解。\\n但是，需要注意的是，你不能直接为小学生们提供太长的翻译服务（一次最多只能翻译文中一个句子），你需要耐心的告诉他们你只能告诉他们大意不能直接提供打断翻译，因为这样不利于提高孩子们的阅读理水平。",
          prompt_type: "simple",
          chat_prompt_config: {},
          completion_prompt_config: {},
          user_input_form: [],
          dataset_query_variable: "",
          opening_statement: "",
          suggested_questions: [],
          more_like_this: { enabled: false },
          suggested_questions_after_answer: { enabled: false },
          speech_to_text: { enabled: false },
          text_to_speech: { enabled: false, voice: "", language: "" },
          retriever_resource: { enabled: true },
          sensitive_word_avoidance: { enabled: false, type: "", configs: [] },
          agent_mode: { enabled: false, max_iteration: 5, strategy: "function_call", tools: [] },
          model: { provider: "openai", name: "gpt-4o-mini", mode: "chat", completion_params: { stop: [] } },
          dataset_configs: {
            retrieval_model: "multiple",
            top_k: 4,
            reranking_mode: "weighted_score",
            weights: {
              vector_setting: { vector_weight: 1, embedding_provider_name: "openai", embedding_model_name: "text-embedding-3-large" },
              keyword_setting: { keyword_weight: 0 }
            },
            reranking_enable: true,
            datasets: {
              datasets: [{ dataset: { enabled: true, id: switchLibraryId } }]
            }
          },
          file_upload: { image: { enabled: true, number_limits: 3, detail: "high", transfer_methods: ["remote_url", "local_file"] } }
        }),
        referrerPolicy: "strict-origin-when-cross-origin",
        mode: "cors",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("data", data);
      console.log('终了');
      return data;
    } catch (error) {
      console.error('There was an error!', error);
    }
  }
}

