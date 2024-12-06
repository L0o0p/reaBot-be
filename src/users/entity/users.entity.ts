import { Entity, Column, PrimaryGeneratedColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { UserProgress } from './user-progress.entity';
import { AnswerSheet } from '../../answer-sheet/entities/answer-sheet.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  conversation_id: string;

  @Column({ nullable: true })
  bot_id: string;

  @Column({ nullable: true })
  bot_key: string;

  @Column({ nullable: true, default: true })
  anim_permission: boolean;

  @OneToMany(() => AnswerSheet, answerSheet => answerSheet.user)
  answerSheets: AnswerSheet[];

  @OneToOne(() => UserProgress, progress => progress.user)
  @JoinColumn()
  progress: UserProgress;
}