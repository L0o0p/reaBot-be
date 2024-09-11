import { Body, Controller, Get, Param, Post, UseGuards, Req } from '@nestjs/common';
import { information } from './dify.dto';
import { DifyService } from './dify.service';
import { Dify } from './dify.entity';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { User } from 'src/users/users.entity';

@Controller('dify')
export class DifyController {
  constructor(private readonly appService: DifyService) { }
  @UseGuards(JwtAuthGuard)
  @Post('/send')
  async sendInformation(@Body() info: information,  @Req() req: any & {user: { id: number, username: string}}) {
    // console.log("reqds",req.user.user);
    return await this.appService.sendInfo(info, req.user.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/chatlog')
  async getChatlog( @Req() req: any & {user: { id: number, username: string}}){
    return this.appService.getChatlog(req.user.user);
  }

}