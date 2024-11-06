import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, BeforeInsert } from 'typeorm';
import { Article } from './article.entity';

@Entity()
export class Paper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Article)
  @JoinColumn({ name: 'articleAId' })
  articleA: Article;

  @ManyToOne(() => Article)
  @JoinColumn({ name: 'articleBId' })
  articleB: Article;

  @Column({ unique: true })
  theme: string;

  @BeforeInsert()
  setDefaultTheme() {
    if (!this.theme) {
      // 这里的逻辑需要生成唯一的 theme，默认格式为 "template_n"
      // 'n' 可以是当前时间戳或任何其他递增的唯一标识符
      this.theme = `template_${Date.now()}`;
    }
  }
}