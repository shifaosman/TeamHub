import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('WorkspacesController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Register and login to get token
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'workspace@example.com',
        username: 'workspaceuser',
        password: 'Test123!',
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'workspace@example.com',
        password: 'Test123!',
      });

    accessToken = loginResponse.body.accessToken;
    userId = loginResponse.body.user._id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/workspaces/organizations (POST)', () => {
    it('should create an organization', () => {
      return request(app.getHttpServer())
        .post('/api/workspaces/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Organization',
          slug: 'test-org',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.name).toBe('Test Organization');
        });
    });
  });

  describe('/api/workspaces/workspaces (POST)', () => {
    let organizationId: string;

    beforeAll(async () => {
      const orgResponse = await request(app.getHttpServer())
        .post('/api/workspaces/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'E2E Test Org',
          slug: 'e2e-test-org',
        });

      organizationId = orgResponse.body._id;
    });

    it('should create a workspace', () => {
      return request(app.getHttpServer())
        .post('/api/workspaces/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          organizationId,
          name: 'Test Workspace',
          slug: 'test-workspace',
          description: 'Test workspace description',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.name).toBe('Test Workspace');
        });
    });
  });
});
