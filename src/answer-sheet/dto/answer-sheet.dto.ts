interface AnswerSubmitResult {
    CorrectAnswerLetter: string;
    correct: boolean;
    additionalExercises: {
        question: string;
        options: string[]
    }
}

interface AnalyzeResult {
    conversation_id: string;
    answer: string//Correct Answer: B) Using water-efficient appliances.\n\nExplanation: Households can save water by using appliances that are designed to use less water. This helps in conserving water and is good for the environment. Other options like increasing water usage or ignoring leaks are not helpful for water conservation.
}

interface PaperReadingTimeFullInfo {
    articleAStartedAt: Date;
    paper: {
        id: number;
    };
    user: {
        id: number;
    };
    totalScore: number;
    articleAFinishedAt: Date | null;
    articleBStartedAt: Date | null;
    articleBFinishedAt: Date | null;
    articleATimeToken: string | null;
    articleBTimeToken: string | null;
    id: number;
    createdAt: Date;
}

interface PaperReadingTime {
    id: number;
    totalScore: number;
    createdAt: Date;
    articleAStartedAt: Date;
    articleAFinishedAt: Date | null;
    articleBStartedAt: Date | null
    articleBFinishedAt: Date | null;
    articleATimeToken: string | null;
    articleBTimeToken: string | null
}