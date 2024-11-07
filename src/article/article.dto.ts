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