import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { applyAppPipeline, getAccessTokenFromBody, verifyUserEmail } from './test-utils';

describe('FilesController (e2e)', () => {
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
        email: 'files@example.com',
        username: 'filesuser',
        password: 'Test123!',
      });
    await verifyUserEmail(app, 'files@example.com');

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'files@example.com', password: 'Test123!' });
    accessToken = getAccessTokenFromBody(loginRes.body);

    const orgSlug = `files-org-${Date.now()}`;
    const orgRes = await request(app.getHttpServer())
      .post('/api/workspaces/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Files Org', slug: orgSlug });

    const wsSlug = `files-ws-${Date.now()}`;
    const wsRes = await request(app.getHttpServer())
      .post('/api/workspaces/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizationId: orgRes.body._id,
        name: 'Files Workspace',
        slug: wsSlug,
      });
    workspaceId = wsRes.body._id;
  }, 15000);

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/files/upload', () => {
    it('should upload a file', () => {
      const buffer = Buffer.from('Hello, e2e file content');
      return request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('workspaceId', workspaceId)
        .attach('file', buffer, 'e2e-test.txt')
        .expect(201)
        .expect((res: { body: Record<string, unknown> }) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body).toHaveProperty('originalName');
          expect(res.body).toHaveProperty('mimeType');
          expect(res.body).toHaveProperty('size');
          expect(res.body.workspaceId).toBe(workspaceId);
        });
    });

    it('should reject upload without workspaceId', () => {
      const buffer = Buffer.from('no workspace');
      return request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', buffer, 'nows.txt')
        .expect(400);
    });
  });

  describe('GET /api/files', () => {
    it('should list files in workspace', () => {
      return request(app.getHttpServer())
        .get('/api/files')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ workspaceId })
        .expect(200)
        .expect((res: { body: Record<string, unknown> }) => {
          expect(res.body).toHaveProperty('files');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.files)).toBe(true);
        });
    });
  });
});
