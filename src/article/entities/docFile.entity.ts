import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Article } from './article.entity';

@Entity()
export class DocFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column()
  size: number;

  @Column({ type: 'longblob' })
  content: Buffer;

  // 添加 tags 字段
  @Column({ nullable: true })
  tag: string;

  @ManyToOne(() => Article, article => article.files)
  article: Article;

}