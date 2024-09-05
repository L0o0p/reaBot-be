import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // 这里启用了CORS，对所有源开放
  await app.listen(3000);
}
bootstrap();
