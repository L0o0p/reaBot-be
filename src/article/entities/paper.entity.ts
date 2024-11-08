import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, BeforeInsert, OneToMany } from 'typeorm';
import { Article } from './article.entity';
import { AnswerSheet } from 'src/answer-sheet/entities/answer-sheet.entity';

@Entity()
export class Paper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Article)
  @JoinColumn({ name: 'articleAId' })
  articleA: Article;

  @Column({nullable: true})
  articleAId: number;

  @ManyToOne(() => Article)
  @JoinColumn({ name: 'articleBId' })
  articleB: Article;

  @Column({nullable: true})
  articleBId: number;

  @Column({ unique: true })
  theme: string;

  @BeforeInsert()
  setDefaultTheme() {
    if (!this.theme) {
      this.theme = `template_${Date.now()}`;
    }
  }
    @OneToMany(() => AnswerSheet, answerSheet => answerSheet.paper)
  answerSheets: AnswerSheet[];
}