import { Paper } from 'src/article/entities/paper.entity';
import { User } from 'src/users/entity/users.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Answer } from './answers.entity';


@Entity()
export class AnswerSheet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({nullable: true})
  totalScore: number;

  @CreateDateColumn({ name: 'creation_timestamp' })
  createdAt: Date;

  @ManyToOne(() => Paper, paper => paper.answerSheets)
  paper: Paper;

  @ManyToOne(() => User, user => user.answerSheets)
  user: User;

  @OneToMany(() => Answer, answer => answer.answerSheet)
  answers: Answer[];
}