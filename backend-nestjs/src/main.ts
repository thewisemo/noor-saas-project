import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.setGlobalPrefix('api');

  const port = parseInt(process.env.PORT || '3001', 10);
  await app.listen(port, '0.0.0.0');


  console.log(`Noor API running on port ${port}`);
}
bootstrap();
