import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { DocFile } from './docFile.entity';

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  title: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  library_id: string;
  
  // 添加 tips 字段
  @Column({ type: 'json', nullable: true })
  tips: string[];



  @OneToMany(() => DocFile, file => file.article)
  files: File[];
}