export interface information {
  information: string
  ifUseConversation_id?: boolean
}

export interface askForTips {
  questionIndex: string;
  tip: string;
}

export interface chatFeedback{
  conversation_id: string,
    answer: string
}


interface State {
  '知识库id': string;
}

interface ModelConfig {
  opening_statement: string;
  suggested_questions: string[];
  suggested_questions_after_answer: {
    enabled: boolean;
  };
  speech_to_text: {
    enabled: boolean;
  };
  text_to_speech: {
    enabled: boolean;
    voice: string;
    language: string;
  };
  retriever_resource: {
    enabled: boolean;
  };
  annotation_reply: {
    enabled: boolean;
  };
  more_like_this: {
    enabled: boolean;
  };
  sensitive_word_avoidance: {
    enabled: boolean;
    type: string;
    configs: any[];
  };
  external_data_tools: any[];
  model: {
    provider: string;
    name: string;
    mode: string;
    completion_params: {
      stop: string[];
    };
  };
  user_input_form: any[];
  dataset_query_variable: string;
  pre_prompt: string;
  agent_mode: {
    enabled: boolean;
    max_iteration: number;
    strategy: string;
    tools: any[];
  };
  prompt_type: string;
  chat_prompt_config: any;
  completion_prompt_config: any;
  dataset_configs: {
    retrieval_model: string;
    top_k: number;
    reranking_mode: string;
    weights: {
      vector_setting: {
        vector_weight: number;
        embedding_provider_name: string;
        embedding_model_name: string;
      };
      keyword_setting: {
        keyword_weight: number;
      };
    };
    reranking_enable: boolean;
    datasets: {
      datasets: {
        dataset: {
          enabled: boolean;
          id: string;
        };
      }[];
    };
  };
  file_upload: {
    image: {
      detail: string;
      enabled: boolean;
      number_limits: number;
      transfer_methods: string[];
    };
    enabled: boolean;
    allowed_file_types: string[];
    allowed_file_extensions: string[];
    allowed_file_upload_methods: string[];
    number_limits: number;
  };
  created_by: string;
  created_at: number;
  updated_by: string;
  updated_at: number;
}

interface BotInfo {
  id: string;
  name: string;
  description: string;
  mode: string;
  icon_type: string;
  icon: string;
  icon_background: string;
  icon_url: string | null;
  enable_site: boolean;
  enable_api: boolean;
  model_config: ModelConfig;
  workflow: any | null;
  site: {
    access_token: string;
    code: string;
    title: string;
    icon_type: string;
    icon: string;
    icon_background: string;
    icon_url: string | null;
    description: string | null;
    default_language: string;
    chat_color_theme: string | null;
    chat_color_theme_inverted: boolean;
    customize_domain: string | null;
    copyright: string | null;
    privacy_policy: string | null;
    custom_disclaimer: string | null;
    customize_token_strategy: string;
    prompt_public: boolean;
    app_base_url: string;
    show_workflow_steps: boolean;
    use_icon_as_answer_icon: boolean;
    created_by: string;
    created_at: number;
    updated_by: string;
    updated_at: number;
  };
  api_base_url: string;
  use_icon_as_answer_icon: boolean;
  created_by: string;
  created_at: number;
  updated_by: string;
  updated_at: number;
  deleted_tools: any[];
}

export interface BotFullInfo {
  state: State;
  bot_info: BotInfo;
}


interface RetrievedResource {
  id: string;
  message_id: string;
  position: number;
  dataset_id: string;
  dataset_name: string;
  document_id: string;
  document_name: string;
  data_source_type: string;
  segment_id: string;
  score: number;
  hit_count: number;
  word_count: number;
  segment_position: number;
  index_node_hash: string | null;
  content: string;
  created_at: number;
}

interface ConversationData {
  id: string;
  conversation_id: string;
  parent_message_id: string;
  inputs: any;
  query: string;
  answer: string;
  message_files: any[];
  feedback: any | null;
  retriever_resources: RetrievedResource[];
  created_at: number;
  agent_thoughts: any[];
  status: string;
  error: any | null;
}

export interface Chatlog {
  limit: number;
  has_more: boolean;
  data: ConversationData[];
}