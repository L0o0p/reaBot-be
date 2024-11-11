import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Question } from './questions.entity';

@Entity()
export class SupplementalQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text")
  supplementalQuestion: string;  // 追加问题的内容

  @Column("text", { array: true })
  options: string[];  // 问题选项

  @Column("text", { nullable: true })
  correctAnswer: string;  // 正确答案

  @Column({ default: 1 })  // 默认分数为 1
  score: number;

  // 设置与 Question 实体的一对一关系
  @OneToOne(() => Question, question => question.supplementalQuestion)
  @JoinColumn({ name: 'questionId' })  // 外键
  question: Question;

  @Column()
  questionId: number;  // 外键列
}