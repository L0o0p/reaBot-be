import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { DocFile } from './docFile.entity';
import { Question } from 'src/answer-sheet/entities/questions.entity';

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  title: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  library_id: string;

  // 添加 tips 字段
  @Column({ type: 'json', nullable: true })
  tips: string[];

  @OneToMany(() => Question, question => question.article)
    questions: Question[];


  @OneToMany(() => DocFile, file => file.article)
  files: File[];
}