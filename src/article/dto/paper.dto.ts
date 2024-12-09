export interface nextPaperResult {
    paperId: number;
    articleA: {
        title: string;
        content: string;
    };
    articleB: {
        title: string;
        content: string;
    };
    result: boolean;
}

export interface PaperProps {
    articleAId: number;
    articleBId: number;
    theme: string;
    id: number
}

export interface newPaper {
    id: number,
    articleA_title: string,
    articleB_title: string
}

interface Article {
    id: number;
    title: string;
    content: string;
    content_raw: string;
    library_id: string;
}

export interface CurrentPaper {
    paperId: number;
    articleA: Article;
    articleB: Article;
}

export interface Progress {
    currentArticleKey: 'A' | 'B';
    currentQuestionNum: number;
}

export interface LatestArticle {
    lastArticle: Article;
    currentArticleKey: string;
    currentQuestionNum: number;
    currentAnserSheetID: number;
    lastPaperID: number
}
