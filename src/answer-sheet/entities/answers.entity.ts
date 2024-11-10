import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Question } from './questions.entity';
import { AnswerSheet } from './answer-sheet.entity';

@Entity()
export class Answer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  answerText: number;

  @Column()
  isCorrect: boolean;

  @ManyToOne(() => Question, question => question.answers)
  question: Question;

  @ManyToOne(() => AnswerSheet, answerSheet => answerSheet.answers)
  answerSheet: AnswerSheet;
}