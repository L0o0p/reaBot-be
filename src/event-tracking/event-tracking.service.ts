import { Injectable } from "@nestjs/common";
import * as mammoth from "mammoth";
import { Question } from "src/answer-sheet/entities/questions.entity";
import { DataSource, Repository } from "typeorm";
import { EventTracking } from "./event-tracking.entity";

interface Event {
    functionName: string,
    userId: number,
    functionDescription: string,
    conversationID?: string,
    serverResponse?: string,
    responseTime?: string
}

@Injectable()
export class EventTrackingService {
    private eventRepository: Repository<EventTracking>;
    constructor(
        private dataSource: DataSource,
    ) {
        this.eventRepository = this.dataSource.getRepository(EventTracking);
    }

    // 增
    async recordEvent(eventData: Event): Promise<void> {
        const event = this.eventRepository.create(eventData);
        await this.eventRepository.save(event);
    }

    // 查:统查
    async countFunctionUsage(): Promise<{ functionName: string; count: number }[]> {
        const result = await this.eventRepository.createQueryBuilder('event')
            .select('event.functionName', 'functionName',)
            .addSelect('COUNT(event.functionName)', 'count')
            .addSelect('event.functionDescription', 'functionDescription') // 直接选择 funct
            .groupBy('event.functionName')
            .addGroupBy('event.functionDescription') // 在 GROUP BY 子句中添加 functionDescription
            .getRawMany();

        return result;
    }

    // 查:根据用户名或ID查找
    async countFunctionUsageByUser(userId: number): Promise<{ functionName: string; count: number; functionDescription: string }[]> {
        const result = await this.eventRepository.createQueryBuilder('event')
            .select('event.functionName', 'functionName')
            .addSelect('COUNT(event.functionName)', 'count')
            .addSelect('event.functionDescription', 'functionDescription') // 选择 functionDescription 字段
            .where('event.userId = :userId', { userId }) // 使用用户 ID 过滤
            .groupBy('event.functionName')
            .addGroupBy('event.functionDescription')
            .getRawMany();

        return result;
    }
}


