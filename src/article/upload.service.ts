import { Injectable } from '@nestjs/common';
import { Question } from 'src/answer-sheet/entities/questions.entity';
import { DataSource } from 'typeorm';

// interface Question {
//     question: string;
//     answers: string[];
//     correctAnswer: string;
//     explanation: string;
// }

@Injectable()
export class TextPreprocessorService {
    private articleText: string;
    private trackingQuestions: Question[];
    private questionRepository;

    constructor(
        private dataSource: DataSource,
    ) {
        this.articleText = '';
        this.trackingQuestions = [];
        this.questionRepository = this.dataSource.getRepository(Question);
    }

    test(text: string) {
        console.log(text);
        return text
    }

    async processText(text: string) {
        // 使用 split 方法根据关键词将文本分成三个部分
        const parts = text.split('\n');

        let articleText = '';
        let questionsText = '';
        let trackingQuestionsText = '';

        // 遍历文本行,根据关键词将内容添加到对应的部分
        let currentSection = 'article';
        for (const line of parts) {
            if (line === '阅读文章') {
                currentSection = 'article';
            } else if (line === '练习题目') {
                currentSection = 'questions';
            } else if (line === '跟踪练习') {
                currentSection = 'trackingQuestions';
            } else {
                switch (currentSection) {
                    case 'article':
                        articleText += `${line}\n`;
                        break;
                    case 'questions':
                        questionsText += `${line}\n`;
                        break;
                    case 'trackingQuestions':
                        trackingQuestionsText += `${line}\n`;
                        break;
                }
            }
        }

        return {
            // articleText: articleText.trim(),
            questionsText: questionsText.trim(),
            // trackingQuestionsText: trackingQuestionsText.trim()
        };
    }

    getArticleText(): string {
        return this.articleText;
    }

    async getQuestions(questionsText: string, articleId:number) {
        const chunks = questionsText.split('\n\n\n'); // 分开每个「问题块」
        console.log('chunks', chunks[0]);
        for (const chunk of chunks) {
            // 问题和选项
            const correctAnswerIndex = chunk.indexOf('Correct Answer:');
            const questionAndOptions = chunk.slice(0, correctAnswerIndex).trim();
            // console.log('Question Text & Options:', questionAndOptions);
            const lines = questionAndOptions.split('\n').filter(line => line.trim() !== '');
            console.log('lines:', lines);
            const question = lines[0];// 1. 取出「问题本身」
            console.log('question:', question);
            const options = lines.slice(1); // 2. 取出「问题选项」
            console.log('options:', options);
            // console.log('OptionsTextOnly :', OptionsTextOnly);
            // 正确答案
            const correctAnswer = chunk.slice(correctAnswerIndex + 'Correct Answer:'.length).trim().split('\n')[0];
            // console.log('Correct Answer:', correctAnswer);
            // 答案解析
            const explanationIndex = chunk.indexOf('Explanation:');
            const explanation = chunk.slice(explanationIndex + 'Explanation:'.length).trim();
            // console.log('Explanation:', explanation);

            // 分别存储问题、选项、答案、解析
            const quizQuestion = new Question();
            quizQuestion.question = question;
            quizQuestion.options = options;
            quizQuestion.correctAnswer = correctAnswer;
            quizQuestion.explanation = explanation;
            quizQuestion.score = 1;
            quizQuestion.articleId = articleId;
            return await this.questionRepository.save(quizQuestion);
        }
        return;
    }

    getTrackingQuestions(): Question[] {
        return this.trackingQuestions;
    }
}
function getTextAfterFirstNewline(text) {
    const index = text.indexOf('\n');
    if (index !== -1) {
        return text.substring(index + 1);
    }
    return ""; // 如果没有换行符，返回空字符串
}