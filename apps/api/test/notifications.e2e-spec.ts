import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { applyAppPipeline, getAccessTokenFromBody, verifyUserEmail } from './test-utils';

describe('NotificationsController (e2e)', () => {
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
        email: 'notif@example.com',
        username: 'notifuser',
        password: 'Test123!',
      });
    await verifyUserEmail(app, 'notif@example.com');

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'notif@example.com', password: 'Test123!' });
    accessToken = getAccessTokenFromBody(loginRes.body);

    const orgSlug = `notif-org-${Date.now()}`;
    const orgRes = await request(app.getHttpServer())
      .post('/api/workspaces/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Notif Org', slug: orgSlug });

    const wsSlug = `notif-ws-${Date.now()}`;
    const wsRes = await request(app.getHttpServer())
      .post('/api/workspaces/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizationId: orgRes.body._id,
        name: 'Notif Workspace',
        slug: wsSlug,
      });
    workspaceId = wsRes.body._id;
  }, 15000);

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/notifications', () => {
    it('should return notifications list', () => {
      return request(app.getHttpServer())
        .get(`/api/notifications?workspaceId=${workspaceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res: { body: Record<string, unknown> }) => {
          expect(res.body).toHaveProperty('notifications');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.notifications)).toBe(true);
        });
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should return unread count', () => {
      return request(app.getHttpServer())
        .get(`/api/notifications/unread-count?workspaceId=${workspaceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res: { body: Record<string, unknown> }) => {
          expect(res.body).toHaveProperty('count');
          expect(typeof res.body.count).toBe('number');
        });
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    it('should mark all as read', () => {
      return request(app.getHttpServer())
        .patch(`/api/notifications/read-all?workspaceId=${workspaceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });
});
