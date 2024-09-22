import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { DocFile } from './docFile.entity';

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  title: string;

  @Column('longtext')
  content: string;

  @Column({ nullable: true })
  library_id: string;

  @OneToMany(() => DocFile, file => file.article)
  files: File[];
}