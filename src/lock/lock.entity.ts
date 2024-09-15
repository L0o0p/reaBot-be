import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Component_lock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  questionLock: string;
  
  @Column()
  chatLock: string;

}