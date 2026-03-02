import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const httpAdapterHost = app.get(HttpAdapterHost);

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

  const allowedOrigins = [process.env.API_URL, process.env.CMS_URL];

  app.use(cookieParser());
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
