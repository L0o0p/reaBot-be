import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Article } from 'src/article/entities/article.entity';
import { Answer } from './answers.entity';

@Entity()
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text")
  question: string;

  @Column("text", { array: true })
  options: string[];

  @Column("text", { nullable: true })
  correctAnswer: string;

  @Column({ nullable: true })// 默认给1
  score: number;

  @ManyToOne(() => Article, article => article.questions)
  @JoinColumn({ name: 'articleId' })
  article: Article;
  @Column({ nullable: true })
  articleId: number;

  @OneToMany(() => Answer, answer => answer.question)
  answers: Answer[];
}