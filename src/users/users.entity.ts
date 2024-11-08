import { AnswerSheet } from 'src/answer-sheet/entities/answer-sheet.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

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

  @Column({ nullable: true, default: true })
  anim_permission: boolean;

  @OneToMany(() => AnswerSheet, answerSheet => answerSheet.user)
  answerSheets: AnswerSheet[];
}