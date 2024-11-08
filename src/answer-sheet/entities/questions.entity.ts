import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Article } from 'src/article/entities/article.entity';
import { Answer } from './answers.entity';

@Entity()
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text")
  text: string;

  @Column("text")
  correctAnswer: string;

  @Column()
  score: number;

  @ManyToOne(() => Article, article => article.questions)
  article: Article;

  @OneToMany(() => Answer, answer => answer.question)
  answers: Answer[];
}