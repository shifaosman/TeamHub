import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import compression from 'compression';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  const nodeEnv = configService.get('NODE_ENV', 'development');
  app.enableCors({
    origin: nodeEnv === 'production' 
      ? configService.get('APP_URL') || 'http://localhost:5173'
      : true, // Allow all origins in development
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());
  
  // Request timeout (30 seconds)
  app.use((req: any, res: any, next: any) => {
    req.setTimeout(30000, () => {
      res.status(408).json({ message: 'Request timeout' });
    });
    next();
  });

  // API prefix
  app.setGlobalPrefix('api');

  // Serve static files for local uploads
  const uploadsPath = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads',
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('TeamHub API')
    .setDescription('TeamHub collaboration platform API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('workspaces', 'Workspace management')
    .addTag('channels', 'Channel management')
    .addTag('messages', 'Message operations')
    .addTag('notifications', 'Notification management')
    .addTag('files', 'File upload and management')
    .addTag('notes', 'Collaborative notes')
    .addTag('search', 'Search functionality')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get('PORT') || 3000;
  try {
    await app.listen(port);
    console.log(`🚀 API is running on: http://localhost:${port}`);
    console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
  } catch (error: any) {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use!`);
      console.error(`   Please free port ${port} or change PORT in .env file`);
      console.error(`   Run: .\\kill-port-3000.ps1 (as Administrator)`);
      process.exit(1);
    }
    throw error;
  }
}

bootstrap();
