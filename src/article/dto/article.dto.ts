export interface CreateArticle {
  title: string;
  content: string;
}

export interface CreatePaper {
  titles: [
    articleA_title: string,
    articleB_title: string
  ]
}

export interface Article {
  id: number;
  title: string;
  content: string;
  library_id: string;
};

export interface ArticleCollection extends Array<Article> { }

export interface BotId {
  bot_id: string
}

interface QuestionOption {
  id: number;
  option: string;
}

export interface ArticleQuestion {
  id: number;
  question: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string;
  score: number;
  f_Question: string;
  f_Options: QuestionOption[];
  f_correctAnswer: string;
  articleId: number;
}

export interface TrackingQuestion {
  id: number;
  articleId: number;
  question: string;
  options: QuestionOption[];
  correctAnswer: string;
}

export interface QuizResponse {
  articleQuestions: ArticleQuestion[];
  trackingQuestions: TrackingQuestion[];
}

interface ExpandedExternalKnowledgeInfo {
  external_knowledge_id: string | null;
  external_knowledge_api_id: string | null;
  external_knowledge_api_name: string | null;
  external_knowledge_api_endpoint: string | null;
}

interface ExpandedRerankerModel {
  reranking_provider_name: string;
  reranking_model_name: string;
}

interface ExpandedRetrievalModelDict {
  search_method: string;
  reranking_enable: boolean;
  reranking_mode: string | null;
  reranking_model: ExpandedRerankerModel;
  weights: any | null;
  top_k: number;
  score_threshold_enabled: boolean;
  score_threshold: number | null;
}

interface ExpandedExternalRetrievalModel {
  top_k: number;
  score_threshold: number | null;
}

interface ExpandedKnowledgeBaseItem {
  id: string;
  name: string;
  description: string;
  provider: string;
  permission: string;
  data_source_type: string;
  indexing_technique: string;
  app_count: number;
  document_count: number;
  word_count: number;
  created_by: string;
  created_at: number;
  updated_by: string;
  updated_at: number;
  embedding_model: string;
  embedding_model_provider: string;
  embedding_available: boolean;
  retrieval_model_dict: ExpandedRetrievalModelDict;
  tags: string[];
  external_knowledge_info: ExpandedExternalKnowledgeInfo;
  external_retrieval_model: ExpandedExternalRetrievalModel;
}

export interface KnowledgeBaseResponse {
  data: ExpandedKnowledgeBaseItem[];
  has_more: boolean;
  limit: number;
  total: number;
  page: number;
}