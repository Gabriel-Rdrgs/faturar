import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOriginEnv = process.env.CORS_ORIGIN;

  const allowedOrigins = [
    'http://localhost:3000',
    'https://faturar-web.vercel.app',
    corsOriginEnv,
  ].filter(Boolean);

  console.log('CORS allowed origins:', allowedOrigins);

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,X-Requested-With,Accept',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();