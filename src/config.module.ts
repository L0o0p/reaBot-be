// src/config/config.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),  // Make ConfigModule global so it's accessible everywhere
  ],
  providers: [ConfigService],  // Register ConfigService as a provider
  exports: [ConfigService],  // Export ConfigService so it can be imported elsewhere
})
export class AppConfigModule {}