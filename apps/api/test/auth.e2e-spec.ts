import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { applyAppPipeline, verifyUserEmail } from './test-utils';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await applyAppPipeline(app);
    await app.init();
  }, 15000);

  afterAll(async () => {
    await app.close();
  });

  describe('/api/auth/register (POST)', () => {
    it('should register a new user', () => {
      const email = `test-${Date.now()}@example.com`;
      const username = `testuser-${Date.now()}`;
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          username,
          password: 'Test123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201)
        .expect((res: { body: Record<string, unknown> }) => {
          expect(res.body).toHaveProperty('tokens');
          expect((res.body.tokens as Record<string, unknown>).accessToken).toBeDefined();
          expect((res.body.tokens as Record<string, unknown>).refreshToken).toBeDefined();
          expect((res.body.user as Record<string, unknown>).email).toBe(email);
        });
    });

    it('should reject duplicate email', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          username: 'user1',
          password: 'Test123!',
        });

      // Duplicate registration
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          username: 'user2',
          password: 'Test123!',
        })
        .expect(400);
    });
  });

  describe('/api/auth/login (POST)', () => {
    it('should login with valid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'login@example.com',
          username: 'loginuser',
          password: 'Test123!',
        });
      await verifyUserEmail(app, 'login@example.com');

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Test123!',
        })
        .expect(200)
        .expect((res: { body: Record<string, unknown> }) => {
          expect(res.body).toHaveProperty('tokens');
          expect((res.body.tokens as Record<string, unknown>).accessToken).toBeDefined();
          expect((res.body.tokens as Record<string, unknown>).refreshToken).toBeDefined();
          expect((res.body.user as Record<string, unknown>).email).toBe('login@example.com');
        });
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('token validation', () => {
    it('should allow access to protected route with valid token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'protected@example.com',
          username: 'protecteduser',
          password: 'Test123!',
        });
      await verifyUserEmail(app, 'protected@example.com');

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'protected@example.com', password: 'Test123!' })
        .expect(200);

      const accessToken = loginRes.body.tokens?.accessToken ?? loginRes.body.accessToken;
      expect(accessToken).toBeTruthy();

      return request(app.getHttpServer())
        .get('/api/workspaces/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect((res: { status: number; body: unknown }) => {
          expect([200, 201]).toContain(res.status);
          expect(Array.isArray(res.body) || res.body !== undefined).toBe(true);
        });
    });

    it('should reject access without token', () => {
      return request(app.getHttpServer())
        .get('/api/workspaces/organizations')
        .expect(401);
    });
  });
});
