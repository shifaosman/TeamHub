import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { applyAppPipeline, getAccessTokenFromBody, verifyUserEmail } from './test-utils';

describe('WorkspacesController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: string;

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
        email: 'workspace@example.com',
        username: 'workspaceuser',
        password: 'Test123!',
      });
    await verifyUserEmail(app, 'workspace@example.com');

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'workspace@example.com',
        password: 'Test123!',
      });

    accessToken = getAccessTokenFromBody(loginResponse.body);
    userId = loginResponse.body.user?._id;
  }, 15000);

  afterAll(async () => {
    await app.close();
  });

  describe('/api/workspaces/organizations (POST)', () => {
    it('should create an organization', () => {
      const slug = `test-org-${Date.now()}`;
      return request(app.getHttpServer())
        .post('/api/workspaces/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Organization',
          slug,
        })
        .expect(201)
        .expect((res: { body: Record<string, unknown> }) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.name).toBe('Test Organization');
        });
    });
  });

  describe('/api/workspaces/workspaces (POST)', () => {
    let organizationId: string;

    beforeAll(async () => {
      const slug = `e2e-test-org-${Date.now()}`;
      const orgResponse = await request(app.getHttpServer())
        .post('/api/workspaces/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'E2E Test Org',
          slug,
        });

      organizationId = orgResponse.body._id;
    }, 10000);

    it('should create a workspace', () => {
      const wsSlug = `test-workspace-${Date.now()}`;
      return request(app.getHttpServer())
        .post('/api/workspaces/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          organizationId,
          name: 'Test Workspace',
          slug: wsSlug,
          description: 'Test workspace description',
        })
        .expect(201)
        .expect((res: { body: Record<string, unknown> }) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.name).toBe('Test Workspace');
        });
    });
  });
});
