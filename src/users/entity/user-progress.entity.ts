import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { User } from './users.entity';
import { Article } from '../../article/entities/article.entity';
import { Paper } from '../../article/entities/paper.entity';

@Entity()
export class UserProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, user => user.progress)
  user: User;

  @ManyToOne(() => Paper)
  @JoinColumn({ name: 'paperId' })
  paper: Paper;

  @ManyToOne(() => Article)
  article: Article;
}