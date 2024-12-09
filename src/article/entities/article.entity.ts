import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { DocFile } from "./docFile.entity";
import { Question } from "../../answer-sheet/entities/questions.entity";

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  title: string;

  @Column("text")
  content: string;

  @Column("text", { nullable: true })
  content_raw: string;

  @Column({ nullable: true })
  library_id: string;

  @OneToMany(() => Question, (question) => question.article)
  questions: Question[];

  @OneToMany(() => DocFile, (file) => file.article)
  files: File[];
}
