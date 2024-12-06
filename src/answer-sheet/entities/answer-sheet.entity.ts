import { Paper } from '../../article/entities/paper.entity';
import { User } from '../../users/entity/users.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Answer } from './answers.entity';


@Entity()
export class AnswerSheet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, default: 0 })
  totalScore: number;

  @CreateDateColumn({ name: 'creation_timestamp' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true
  })
  articleAStartedAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true
  })
  articleAFinishedAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true
  })
  articleBStartedAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true
  })
  articleBFinishedAt: Date;

  @Column("text", { nullable: true })
  articleATimeToken: string;

  @Column("text", { nullable: true })
  articleBTimeToken: string;

  @Index('idx_paper_user_unique', ['paper', 'user'], { unique: true })
  @ManyToOne(() => Paper, paper => paper.answerSheets)
  paper: Paper;

  @ManyToOne(() => User, user => user.answerSheets)
  user: User;

  @OneToMany(() => Answer, answer => answer.answerSheet)
  answers: Answer[];
}