import { Body, Controller, Get, Param, Post, UseGuards, Req, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { AnswerSheetService } from 'src/answer-sheet/answer-sheet.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { DifyService } from 'src/chat/dify.service';
import { EventTrackingService } from 'src/event-tracking/event-tracking.service';
import { UsersService } from 'src/users/users.service';

@UseGuards(JwtAuthGuard)
@Controller('event')
export class EventTrackingController {
    constructor(
        private readonly eventService: EventTrackingService,
        private readonly answerSheetService: AnswerSheetService,
        private readonly chatService: DifyService,
        private readonly userService: UsersService,
    ) {
        // const current_database_id = this.appService.getCurrentDatabaseId();
    }


    // 所有看板信息
    @Get('/all')
    async getAll(@Req() req: {
        user: {
            id: number;
            userId: number;
            username: string;
        }
    }): Promise<any> {
        const allAnswerSheets = await this.answerSheetService.findAllAnswerSheets()
        const eventTracking = await this.eventService.countFunctionUsage();
        const historyChatlog = await this.chatService.getHistoryChatlog(req.user.userId, req.user.username);
        return {
            allAnswerSheets,
            eventTracking,
            historyChatlog
        }
    }

    @Get('/a/:id')
    async getChatlog(@Req() req: {
        user: {
            id: number;
            userId: number;
            username: string;
        }
    }, @Param('id') id: number): Promise<any> {
        const confirmID = Number(id)// 以防id被识别为string
        const allAnswerSheets = await this.answerSheetService.findAnswerSheetsByUserID(confirmID)
        const eventTracking = await this.eventService.countFunctionUsageByUser(confirmID);
        const userName = (await this.userService.findByUserID(confirmID)).username;
        const historyChatlog = await this.chatService.getHistoryChatlog(confirmID, userName);
        return {
            allAnswerSheets,
            eventTracking,
            historyChatlog
        }
    }

}