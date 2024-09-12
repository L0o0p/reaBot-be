import { Body, Controller, Get, Param, Post, UseGuards, Req } from '@nestjs/common';
import { information } from './dify.dto';
import { DifyService } from './dify.service';
import { Dify } from './dify.entity';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { User } from 'src/users/users.entity';

@Controller('chat')
export class DifyController {

  constructor(private readonly appService: DifyService) {
    // const current_database_id = this.appService.getCurrentDatabaseId();
  }
  @UseGuards(JwtAuthGuard)
  @Post('/send')
  async sendInformation(@Body() info: information,  @Req() req: any & {user: { id: number, username: string}}) {
    // console.log("reqds",req.user.user);
    return await this.appService.sendInfo(info, req.user.user);
  }
  @Get('/articleUsedByBot')
  async getBottest() {
    const library_id = await this.appService.fetchBotInfo() as unknown as string
    return this.appService.getArticleName(library_id)
  }

  @UseGuards(JwtAuthGuard)
  @Get('/chatlog')
  async getChatlog( @Req() req: any & {user: { id: number, username: string}}){
    return this.appService.getChatlog(req.user.user);
  }

}