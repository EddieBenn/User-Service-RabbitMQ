import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  HttpStatus,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { HttpExceptionFilter } from './filters/exception-filter';
import { initializeTransactionalContext } from 'typeorm-transactional';
import {
  ExpressAdapter,
  type NestExpressApplication,
} from '@nestjs/platform-express';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config } from './config';

async function bootstrap(): Promise<NestExpressApplication> {
  initializeTransactionalContext();
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
    { cors: true },
  );

  const reflector = app.get(Reflector);

  const PORT = config.PORT;

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per 15 mintutes
    }),
  );
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      exceptionFactory: (errors) => new UnprocessableEntityException(errors),
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter(reflector));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('User Service (RabbitMQ)')
    .setDescription(
      'This service enables you onboard users and manage their accounts.',
    )
    .setVersion('1.0')
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
    })
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('documentationView', app, document);

  await app.listen(PORT, () => {
    console.log(`🚀 Server running on port:: ${PORT}`);
    console.info(
      `🔗 Swagger docs available at: ${config.APP_URL}${PORT}/documentationView`,
    );
  });

  return app;
}
void bootstrap();
