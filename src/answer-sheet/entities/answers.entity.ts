import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Question } from './questions.entity';
import { AnswerSheet } from './answer-sheet.entity';
import { User } from 'src/users/entity/users.entity';

@Entity()
export class Answer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  answerText: number;

  @Column()
  isCorrect: boolean;

  @Column({ type: 'boolean', default: false })
  ifTracking: boolean;
  
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;  // 使用这个字段来跟踪进度

  @ManyToOne(() => Question, question => question.answers)
  question: Question;

  @ManyToOne(() => AnswerSheet, answerSheet => answerSheet.answers)
  answerSheet: AnswerSheet;

  @ManyToOne(() => User, user => user.answerSheets)
  user: User;
}