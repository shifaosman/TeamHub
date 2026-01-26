import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Health Check (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return API documentation', () => {
    return request(app.getHttpServer())
      .get('/docs')
      .expect(200);
  });

  it('should have Swagger JSON available', () => {
    return request(app.getHttpServer())
      .get('/docs-json')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('openapi');
        expect(res.body).toHaveProperty('info');
        expect(res.body.info.title).toBe('TeamHub API');
      });
  });
});
