import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { information } from './dify.dto';
import { DifyService } from './dify.service';
import { Dify } from './dify.entity';

@Controller('dify')
export class DifyController {
  constructor(private readonly appService: DifyService) { }

  @Post('/send')
  async sendInformation(@Body() info: information) {
    return await this.appService.sendInfo(info);
  }

}