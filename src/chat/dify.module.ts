import { Module } from '@nestjs/common';
import { DifyController } from './dify.controller';
import { DifyService } from './dify.service';

@Module({
  providers: [DifyService],
  controllers: [DifyController]
})
export class DifyModule {
  import: [];
}
