import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class EventTracking {
    @PrimaryGeneratedColumn()
    id: number;

    // 发生的具体时间
    @CreateDateColumn({ type: 'timestamp' })
    timestamp: Date;

    // 功能名称
    @Column()
    functionName: string;

    // 具体发问
    @Column()
    functionDescription: string;

    // 用户
    @Column()
    userId: number;

    // 会话ID
    @Column({ nullable: true })
    conversationID: string;

    // AI返回的内容
    @Column({ nullable: true })
    serverResponse: string;

    // 响应时间（性能检测
    @Column({ nullable: true })
    responseTime: string;
}