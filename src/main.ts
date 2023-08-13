import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './common/swagger-setting';
import { HttpStatus } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'development' ? ['error', 'warn', 'log', 'verbose', 'debug'] : ['error', 'warn', 'log'],
  });

  const configService = app.select(AppModule).get(ConfigService);

  app.enableCors({
    origin: [
      configService.get('CLIENT_URL'),
      configService.get('CLIENT_LOCAL_URL1'),
      configService.get('CLIENT_LOCAL_URL2'),
    ],
    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );
  app.enableVersioning();

  setupSwagger(app);

  await app.listen(configService.get('PORT'), () => {
    console.log(`Server is listening on port ${configService.get('PORT')}`);
  });
}
bootstrap();
