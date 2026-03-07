import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { applyAppPipeline, getAccessTokenFromBody, verifyUserEmail } from './test-utils';

describe('NotesController (e2e)', () => {
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
        email: 'notes@example.com',
        username: 'notesuser',
        password: 'Test123!',
      });
    await verifyUserEmail(app, 'notes@example.com');

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'notes@example.com', password: 'Test123!' });
    accessToken = getAccessTokenFromBody(loginRes.body);

    const orgSlug = `notes-test-org-${Date.now()}`;
    const orgRes = await request(app.getHttpServer())
      .post('/api/workspaces/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Notes Test Org', slug: orgSlug });

    const wsSlug = `notes-test-ws-${Date.now()}`;
    const wsRes = await request(app.getHttpServer())
      .post('/api/workspaces/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        organizationId: orgRes.body._id,
        name: 'Notes Test Workspace',
        slug: wsSlug,
        description: 'For notes e2e',
      });
    workspaceId = wsRes.body._id;
  }, 15000);

  afterAll(async () => {
    await app.close();
  });

  describe('/api/notes (POST)', () => {
    it('should create a note', () => {
      return request(app.getHttpServer())
        .post('/api/notes')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          workspaceId,
          title: 'E2E Test Note',
          content: 'Collaborative note content for e2e.',
        })
        .expect(201)
        .expect((res: { body: Record<string, unknown> }) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.title).toBe('E2E Test Note');
          expect(String(res.body.content)).toContain('Collaborative');
          expect(res.body.workspaceId).toBe(workspaceId);
        });
    });
  });

  describe('/api/notes (GET) and PATCH', () => {
    let noteId: string;

    it('should list notes and update a note', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/notes')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          workspaceId,
          title: 'Note to Update',
          content: 'Original content',
        })
        .expect(201);

      noteId = createRes.body._id;

      const listRes = await request(app.getHttpServer())
        .get(`/api/notes?workspaceId=${workspaceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(listRes.body)).toBe(true);
      const found = listRes.body.find((n: { _id: string }) => n._id === noteId);
      expect(found).toBeDefined();
      expect(found.title).toBe('Note to Update');

      await request(app.getHttpServer())
        .patch(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated Note Title', content: 'Updated content' })
        .expect(200)
        .expect((res: { body: Record<string, unknown> }) => {
          expect(res.body.title).toBe('Updated Note Title');
          expect(res.body.content).toBe('Updated content');
        });
    });
  });
});
