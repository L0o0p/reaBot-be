import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Dify {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  title: string;

  @Column('text')
  content: string;
}