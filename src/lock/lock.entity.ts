import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Lock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  questionLock: string;
  
  @Column()
  chatLock: string;

}