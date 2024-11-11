import { Paper } from 'src/article/entities/paper.entity';
import { User } from 'src/users/users.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Answer } from './answers.entity';


@Entity()
export class AnswerSheet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({nullable: true})
  totalScore: number;

  @ManyToOne(() => Paper, paper => paper.answerSheets)
  paper: Paper;

  @ManyToOne(() => User, user => user.answerSheets)
  user: User;

  @OneToMany(() => Answer, answer => answer.answerSheet)
  answers: Answer[];
}