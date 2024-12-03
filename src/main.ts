import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { urlencoded, json } from 'express';
import { AuthService } from './auth/auth.service';
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb' }));
  app.enableCors(); // 这里启用了CORS，对所有源开放
  // 获取服务实例
  const authService = app.get(AuthService);

  // 执行登录
  await authService.loginAndGetTokens();
  await app.listen(3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
