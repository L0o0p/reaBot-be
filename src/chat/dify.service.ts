import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { User } from "../users/entity/users.entity";
import axios from "axios";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "src/auth/auth.service";

@Injectable()
export class DifyService {
  private userRepository: Repository<User>;
  public current_bot_config: {
    context_dbs: string[];
  } = {
    context_dbs: [],
  };
  private logger = new Logger("DifyService");
  private DIFY_URL: string;
  @Inject(AuthService)
  private readonly authService: AuthService;
  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {
    this.userRepository = this.dataSource.getRepository(User);
    this.DIFY_URL = this.configService.get<string>("DIFY_URL");
  }

  async getBotIdByUserId(userId: number): Promise<string | null> {
    console.log("userId", userId);
    if (!userId) throw new UnauthorizedException();
    const user = await this.userRepository.findOne({ where: { id: userId } });
    console.log("user_found", user);
    if (user) {
      return user.bot_id;
    }
    return null;
  }

  async getBotKeyByUserId(userId: number): Promise<string | null> {
    console.log("userId", userId);
    if (!userId) throw new UnauthorizedException();
    const user = await this.userRepository.findOne({ where: { id: userId } });
    console.log("user_found", user);
    if (user) {
      return user.bot_key;
    }
    return null;
  }
  // 发送对话消息
  async sendInfo(
    information: string,
    user: { id?: number; userId: any; username?: string },
    skip_cid?: boolean,
  ) {
    // userId -> User
    console.log("informationX", information);
    console.log("user:", user);

    const user_found = await this.userRepository.findOne({
      where: { id: user.userId },
    });
    console.log("user_found", user_found);
    console.log("user_found.bot_key", user_found.bot_key);
    const url = `${this.DIFY_URL}/v1/chat-messages`;
    const apiKey = user_found.bot_key; // 使用正确的API密钥
    const headers = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    const userID = `readbotuser-${user.userId}`;
    let cid = user_found.conversation_id || "";
    const body = {
      inputs: {},
      query: information, // 确保这里是正确的信息字段
      response_mode: "blocking",
      // auto_generate_name: false,
      conversation_id: skip_cid ? "" : cid,
      user: userID,
    };
    console.log(JSON.stringify(body, null, 2));

    // 等待 postData 方法返回结果
    const { conversation_id, answer } = await this.postData(url, body, headers);
    console.log(conversation_id, answer);
    if (skip_cid) {
      await this.updateUserConversation(conversation_id, user_found);
    }
    // 根据业务需求调整返回值
    return { conversation_id, answer };
  }

  // 发送对话消息- 执行方法
  async postData(url, body, headers) {
    try {
      const response = await axios.post(url, body, { headers });
      console.log("Success:", response.data.conversation_id);
      return {
        conversation_id: response.data.conversation_id,
        answer: response.data.answer,
      };
    } catch (error) {
      console.error("Error:", error.message);
      console.error("信息没有成功发送到dify服务器");
      throw new InternalServerErrorException("无法发送信息到 Dify 服务器");
    }
  }

  // 给用户创建新的conversation_id
  async updateUserConversation(cvsId: string, user: User): Promise<void> {
    user.conversation_id = cvsId;
    await this.userRepository.save(user);
  }
  //给获取当前用户的聊天历史记录
  async getChatlog(user) {
    // userId -> User
    console.log("id", user);
    const user_found = await this.userRepository.findOne({
      where: { id: user.userId },
    });
    console.log("user_found", user_found);
    const userID = `readbotuser-${user.userId}`;

    const username = userID;
    const conversationId = user_found.conversation_id; // 如果 conversation_id 有具体值，请填写在这里
    console.log("找到对应的conversationId", conversationId);
    console.log("1");

    const url =
      `${this.DIFY_URL}/v1/messages?user=${username}&conversation_id=${conversationId}&limit=100&first_id=`;
    const apiKey = await this.getBotKeyByUserId(user.userId); // Replace 'YOUR_API_KEY' with your actual API key
    console.log("apiKey", apiKey);

    return this.fetchData(url, apiKey);
  }
  //给获取当前用户的聊天历史记录-执行方法
  async fetchData(url: string, apiKey: string) {
    return fetch(url, {
      method: "GET", // 指定请求方法为 GET
      headers: {
        "Authorization": `Bearer ${apiKey}`, // 设置授权头，使用提供的 API 密钥
      },
    })
      .then((response) => {
        if (!response.ok) {
          // 如果响应状态码不是 2xx，抛出一个错误
          throw new Error("Network response was not ok");
        }
        return response.json(); // 解析 JSON 数据
      })
      .catch((error) => {
        console.error("There was a problem with your fetch operation:", error); // 在控制台输出可能出现的错误
        throw error; // 将错误向上抛出，以便调用者可以处理
      });
  }

  async getSubstringAfterDash(str) {
    const index = str.indexOf("-");
    if (index !== -1) {
      return str.substring(index + 1);
    }
    return ""; // 如果没有找到 "-", 返回空字符串
  }

  // 获取机器人信息(主要是为了获取机器人使用的知识库id)
  async fetchBotLibraryId(user) {
    try {
      // You should use await with fetch to handle the promise properly
      const botId = await this.getBotIdByUserId(user);
      const difyUserToken = await this.authService.getCurrentToken();
      const response = await fetch(
        `${this.DIFY_URL}/console/api/apps/${botId}`,
        {
          headers: {
            "accept": "*/*",
            "authorization": `Bearer ${difyUserToken}`,
            "cache-control": "no-cache",
            "content-type": "application/json",
            "pragma": "no-cache",
            "Referer": `${this.DIFY_URL}/app/${botId}/configuration`,
            "Referrer-Policy": "strict-origin-when-cross-origin",
          },
          method: "GET",
        },
      );

      // Check if the response was successful
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parse the JSON from the response
      const data = await response.json();
      const id = data.model_config.dataset_configs.datasets.datasets[0].dataset
        .id as string;
      console.log("机器人知识库", id); // Log the data to the console
      console.log("终了"); // Log the data to the console
      return id;
    } catch (error) {
      console.error("There was an error!", error);
    }
  }
  // 通过知识库id获取文章title
  async getArticleName(id: string, userId: number) {
    try {
      console.log("getArticleName");
      console.log("id", id, "userId", userId);
      // You should use await with fetch to handle the promise properly
      const botId = await this.getBotIdByUserId(userId);
      console.log("botId", botId);
      const difyUserToken = await this.authService.getCurrentToken();
      const response = await fetch(
        `${this.DIFY_URL}/console/api/datasets?page=1&ids=${id}`,
        {
          headers: {
            "accept": "*/*",
            "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
            "authorization": `Bearer ${difyUserToken}`,
            "cache-control": "no-cache",
            "content-type": "application/json",
            "pragma": "no-cache",
            "priority": "u=1, i",
            "sec-ch-ua":
              '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "Referer": `${this.DIFY_URL}/app/${botId}/configuration`,
            "Referrer-Policy": "strict-origin-when-cross-origin",
          },
          method: "GET",
        },
      );

      // Check if the response was successful
      if (!response.ok) {
        console.log("not ok");
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Parse the JSON from the response
      const data = await response.json();
      console.log("data.data[0]", data);
      const title = data.data[1].name;
      const library_id = data.data[1].id;
      return { title, library_id };
    } catch (error) {
      console.error("There was an error!", error);
    }
  }
  // 获取机器人信息(获取机器人id)
  async fetchBotInfo(bot_id: string) {
    try {
      const difyUserToken = await this.authService.getCurrentToken();
      console.log("difyUserToken", difyUserToken);

      // You should use await with fetch to handle the promise properly
      const response = await fetch(
        `${this.DIFY_URL}/console/api/apps/${bot_id}`,
        {
          headers: {
            "accept": "*/*",
            "authorization": `Bearer ${difyUserToken}`,
            "cache-control": "no-cache",
            "content-type": "application/json",
            "pragma": "no-cache",
            "Referer": `${this.DIFY_URL}/app/${bot_id}/configuration`,
            "Referrer-Policy": "strict-origin-when-cross-origin",
          },
          method: "GET",
        },
      );

      // Check if the response was successful
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parse the JSON from the response
      const data = await response.json();
      console.log("机器人信息", data); // Log the data to the console
      console.log("终了"); // Log the data to the console
      return data;
    } catch (error) {
      console.error("There was an error!", error);
    }
  }
  // 更改机器人使用的知识库
  async changeSourceLibrary(bot_Id: string, switchLibraryId: string) {
    console.log("bot_IdX", bot_Id);
    const url = `${this.DIFY_URL}/console/api/apps/${bot_Id}/model-config`;
    console.log("urlX", url);
    const difyUserToken = await this.authService.getCurrentToken();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "accept": "*/*",
        "authorization": `Bearer ${difyUserToken}`,
        "cache-control": "no-cache",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        pre_prompt:
          `现在你是一个中国小学生的英文阅读理解题目讲解老师，向你提问的用户都是你教授的小学生，请你仅根据提供的英文短文内容以及小学生对你的提问进行题目和语法知识的讲解。但是，需要注意的是:
1. 你不能直接为小学生们提供太长的翻译服务（一次最多只能翻译文中一个句子），你需要耐心的告诉他们你只能告诉他们大意不能直接提供打断翻译，因为这样不利于提高孩子们的阅读理水平。
2. 为了便于小学生阅读和理解，你必须回答得言简意赅、格式工整。每次回答得内容尽量不要超过200字，内容比较多或者是有选项的内容的话最好能够另起一行。
3. 如果学生向你提出「原文依据」或者「在原文哪里可以找到答案」之类的问题，请尽可能给出原文。`,
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
        agent_mode: {
          enabled: false,
          max_iteration: 5,
          strategy: "function_call",
          tools: [],
        },
        model: {
          provider: "moonshot",
          name: "moonshot-v1-32k",
          mode: "chat",
          completion_params: { stop: [] },
        },
        dataset_configs: {
          retrieval_model: "multiple",
          top_k: 4,
          reranking_mode: "weighted_score",
          weights: {
            vector_setting: {
              vector_weight: 1,
              embedding_provider_name: "openai",
              embedding_model_name: "text-embedding-3-large",
            },
            keyword_setting: { keyword_weight: 0 },
          },
          reranking_enable: true,
          datasets: {
            datasets: [{ dataset: { enabled: true, id: switchLibraryId } }],
          },
        },
        file_upload: {
          image: {
            enabled: true,
            number_limits: 3,
            detail: "high",
            transfer_methods: ["remote_url", "local_file"],
          },
        },
      }),
      referrerPolicy: "strict-origin-when-cross-origin",
      mode: "cors",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("data", data);
    console.log("终了");
    return data;
  }

  async newConversation() {
    const url = "https://dify.cyte.site/api/site";
    const difyUserToken = await this.authService.getCurrentToken();
    const header = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${difyUserToken}`,
    };
    const options = {
      method: "GET",
      headers: header,
    };
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
  }
}
