import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { applyAppPipeline } from './test-utils';

describe('Health Check (e2e)', () => {
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

  it('should have app listening', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(404);
  });
});
