import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import request from 'supertest';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

/**
 * Applies the same pipeline as main.ts so e2e requests match production (e.g. /api/auth/login).
 */
export async function applyAppPipeline(app: INestApplication): Promise<INestApplication> {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  return app;
}

/**
 * Helper to get access token from login/register response body.
 * Auth API returns { user, tokens: { accessToken, refreshToken } }.
 */
export function getAccessTokenFromBody(body: { tokens?: { accessToken?: string }; accessToken?: string }): string {
  return body.tokens?.accessToken ?? body.accessToken ?? '';
}

/** Verify user email so login succeeds (login requires isEmailVerified). */
export async function verifyUserEmail(app: INestApplication, email: string): Promise<void> {
  const userModel = app.get<Model<{ emailVerificationToken?: string }>>(getModelToken('User'));
  const user = await userModel.findOne({ email }).exec();
  const token = user?.emailVerificationToken;
  if (token) {
    await request(app.getHttpServer()).get(`/api/auth/verify-email?token=${token}`).expect(200);
  }
}
