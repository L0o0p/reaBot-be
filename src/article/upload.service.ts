import { Injectable } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { Question } from 'src/answer-sheet/entities/questions.entity';
import { DataSource } from 'typeorm';
import { ArticleService } from './article.service';

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
        private articleService: ArticleService
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
            articleText: articleText.trim(),
            questionsText: questionsText.trim(),
            trackingQuestionsText: trackingQuestionsText.trim()
        };
    }

    getArticleText(): string {
        return this.articleText;
    }
    async processArticle(
        file: Express.Multer.File,
        datasetId: string
    ) {
        const buf = { buffer: Buffer.from(file.buffer) }
        const htmlData = await mammoth.convertToHtml(buf);
        console.log('html', htmlData.value);
        const savableData = preprocessArticleContent(htmlData.value)
        console.log('savableData', savableData);

        // 3. 储存到本地
        const tag = "article"
        // processedText,
        this.articleService.save_articleFile(file, datasetId, tag, savableData);

        const finishText = 'Article have been saved'
        console.log(finishText);
        return finishText
    }
    // async processAndStoreQuestions(questionsText: string, articleId: number) {
    //     const chunks_A: string[] = questionsText.split('\n\n\n'); // 分开每个「问题块」
    //     const savedQuestions: Question[] = [];

    //     for (const chunk of chunks_A) {
    //         // 问题和选项
    //         const correctAnswerIndex = chunk.indexOf('Correct Answer:');
    //         const questionAndOptions = chunk.slice(0, correctAnswerIndex).trim();
    //         const lines = questionAndOptions.split('\n').filter(line => line.trim() !== '');
    //         const question = lines[0]; // 1. 取出「问题本身」
    //         const options = lines.slice(1); // 2. 取出「问题选项」

    //         // 正确答案
    //         const correctAnswer = chunk.slice(correctAnswerIndex + 'Correct Answer:'.length).trim().split('\n')[0];

    //         // 答案解析
    //         const explanationIndex = chunk.indexOf('Explanation:');
    //         const explanation = chunk.slice(explanationIndex + 'Explanation:'.length).trim();

    //         // 检查数据库中是否已存在相同的问题记录
    //         let existingQuestion = await this.questionRepository.findOne({
    //             where: {
    //                 question: question,
    //                 articleId: articleId
    //             }
    //         });

    //         if (existingQuestion) {
    //             // 更新现有的问题记录
    //             existingQuestion.question = question;
    //             existingQuestion.options = options;
    //             existingQuestion.correctAnswer = correctAnswer;
    //             existingQuestion.explanation = explanation;
    //             await this.questionRepository.save(existingQuestion);
    //             savedQuestions.push(existingQuestion);
    //         } else {
    //             // 创建新的问题记录
    //             const quizQuestion = new Question();
    //             quizQuestion.question = question;
    //             quizQuestion.options = options;
    //             quizQuestion.correctAnswer = correctAnswer;
    //             quizQuestion.explanation = explanation;
    //             quizQuestion.score = 1;
    //             quizQuestion.articleId = articleId;
    //             const savedQuestion = await this.questionRepository.save(quizQuestion);
    //             savedQuestions.push(savedQuestion);
    //         }
    //     }
    // }
    async processQuestions(questionsText: string, procceedF_Qustions: Question[], articleId: number) {
        const chunks: string[] = questionsText.split('\n\n\n'); // 分开每个「问题块」
        const savedQuestions: Question[] = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];

            // 问题和选项
            const correctAnswerIndex = chunk.indexOf('Correct Answer:');
            const questionAndOptions = chunk.slice(0, correctAnswerIndex).trim();
            const lines = questionAndOptions.split('\n').filter(line => line.trim() !== '');
            const question = lines[0]; // 1. 取出「问题本身」
            const options = lines.slice(1); // 2. 取出「问题选项」

            // 正确答案
            const correctAnswer = chunk.slice(correctAnswerIndex + 'Correct Answer:'.length).trim().split('\n')[0];

            // 答案解析
            const explanationIndex = chunk.indexOf('Explanation:');
            const explanation = chunk.slice(explanationIndex + 'Explanation:'.length).trim();

            // 检查数据库中是否已存在相同的问题记录
            let existingQuestion = await this.questionRepository.findOne({
                where: {
                    question: question,
                    articleId: articleId
                }
            });

            if (existingQuestion) {
                console.log('existingQuestion', existingQuestion);
                console.log('更新现有的问题记录');
                // 更新现有的问题记录
                existingQuestion.question = question;
                existingQuestion.f_Question = procceedF_Qustions[i].question;
                existingQuestion.options = options;
                existingQuestion.f_Options = procceedF_Qustions[i].options;
                existingQuestion.correctAnswer = correctAnswer;
                existingQuestion.f_correctAnswer = procceedF_Qustions[i].correctAnswer;
                existingQuestion.explanation = explanation;
                await this.questionRepository.save(existingQuestion);
                savedQuestions.push(existingQuestion);
            } else {
                // 创建新的问题记录
                console.log('没有已存在的问题记录，创建新的问题记录');
                const quizQuestion = new Question();
                quizQuestion.question = question;
                quizQuestion.f_Question = procceedF_Qustions[i].question;
                quizQuestion.options = options;
                quizQuestion.f_Options = procceedF_Qustions[i].options;
                quizQuestion.correctAnswer = correctAnswer;
                quizQuestion.f_correctAnswer = procceedF_Qustions[i].correctAnswer;
                quizQuestion.explanation = explanation;
                quizQuestion.score = 1;
                quizQuestion.articleId = articleId;
                const savedQuestion = await this.questionRepository.save(quizQuestion);
                savedQuestions.push(savedQuestion);
            }
            console.log('savedQuestions', savedQuestions);
        }
    }
    async processFQuestions(trackingQuestionsText: string) {
        const chunks: string[] = trackingQuestionsText.split('\n\n\n'); // 分开每个「问题块」
        const savedQuestions: Question[] = [];

        for (const chunk of chunks) {
            // 问题和选项
            const correctAnswerIndex = chunk.indexOf('Correct Answer:');
            const questionAndOptions = chunk.slice(0, correctAnswerIndex).trim();
            const lines = questionAndOptions.split('\n').filter(line => line.trim() !== '');
            const question = lines[0]; // 1. 取出「问题本身」
            const options = lines.slice(1); // 2. 取出「问题选项」

            // 正确答案
            const correctAnswer = chunk.slice(correctAnswerIndex + 'Correct Answer:'.length).trim().split('\n')[0];

            console.log('没有已存在的问题记录，创建新的问题记录');
            const quizQuestion = new Question();
            quizQuestion.question = question;
            quizQuestion.options = options;
            quizQuestion.correctAnswer = correctAnswer;
            savedQuestions.push(quizQuestion);
        }
        return savedQuestions
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
function preprocessArticleContent(content: string): string {
    const dContent = removeReadArticleHeader(content);
    console.log('dContent', dContent);

    const startIndex = 0
    const endIndex = dContent.indexOf('<h3>练习题目</h3>');

    if (endIndex === -1) {
        return ''; // 如果找不到关键标签,返回空字符串
    }

    return dContent.slice(startIndex, endIndex);
}

function removeReadArticleHeader(content: string): string {
    if (content.startsWith('<h3>阅读文章</h3>')) {
        return content.slice('<h3>阅读文章</h3>'.length);
    }
    return content;
}