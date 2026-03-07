import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { applyAppPipeline, getAccessTokenFromBody, verifyUserEmail } from './test-utils';

describe('AnalyticsController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let workspaceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await applyAppPipeline(app);
    await app.init();

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'analytics@example.com',
        username: 'analyticsuser',
        password: 'Test123!',
      });
    await verifyUserEmail(app, 'analytics@example.com');

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'analytics@example.com', password: 'Test123!' });
    accessToken = getAccessTokenFromBody(loginRes.body);

    const orgSlug = `analytics-org-${Date.now()}`;
    const orgRes = await request(app.getHttpServer())
      .post('/api/workspaces/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Analytics Org', slug: orgSlug });

    const wsSlug = `analytics-ws-${Date.now()}`;
    const wsRes = await request(app.getHttpServer())
      .post('/api/workspaces/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizationId: orgRes.body._id,
        name: 'Analytics Workspace',
        slug: wsSlug,
      });
    workspaceId = wsRes.body._id;
  }, 15000);

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/workspaces/:workspaceId/analytics', () => {
    it('should return workspace analytics', () => {
      return request(app.getHttpServer())
        .get(`/api/workspaces/${workspaceId}/analytics`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ period: '30d' })
        .expect(200)
        .expect((res: { body: Record<string, unknown> }) => {
          expect(res.body).toBeDefined();
          expect(res.body).toHaveProperty('overview');
          expect(res.body).toHaveProperty('taskAnalytics');
          expect(res.body).toHaveProperty('projectAnalytics');
          expect(res.body).toHaveProperty('collaborationAnalytics');
          expect(res.body).toHaveProperty('period');
        });
    });

    it('should reject without auth', () => {
      return request(app.getHttpServer())
        .get(`/api/workspaces/${workspaceId}/analytics`)
        .query({ period: '7d' })
        .expect(401);
    });
  });
});
