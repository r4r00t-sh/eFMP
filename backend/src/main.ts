import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { SecurityService } from './security/security.service';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const securityService = app.get(SecurityService);

  // Security Headers with Helmet
  app.use(helmet(securityService.getHelmetConfig()));

  // Request Size Limits
  const maxRequestSize = configService.get<string>('MAX_REQUEST_SIZE', '10mb');
  app.use(json({ limit: maxRequestSize }));
  app.use(urlencoded({ extended: true, limit: maxRequestSize }));

  // Enhanced CORS Configuration
  app.enableCors(securityService.getCorsConfig());

  // Global Validation Pipe with enhanced security
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: configService.get<string>('NODE_ENV') === 'production', // Hide error details in production
      validationError: {
        target: false, // Don't expose the target object
        value: false, // Don't expose the value
      },
    }),
  );

  // Trust Proxy (for rate limiting behind reverse proxy)
  app.set('trust proxy', 1);

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Environment: ${configService.get<string>('NODE_ENV', 'development')}`);
}
bootstrap();
