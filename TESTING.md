# Testing Guide

## Overview

TeamHub includes comprehensive testing infrastructure for both backend and frontend.

## Backend Testing

### Unit Tests

Unit tests are located in `apps/api/src/**/*.spec.ts` files.

**Run unit tests:**
```bash
cd apps/api
npm run test
```

**Run with coverage:**
```bash
cd apps/api
npm run test:cov
```

**Watch mode:**
```bash
cd apps/api
npm run test:watch
```

### E2E Tests

E2E tests are located in `apps/api/test/*.e2e-spec.ts` files.

**Run e2e tests:**
```bash
cd apps/api
npm run test:e2e
```

**Current E2E Test Coverage:**
- Authentication flow (register, login)
- Workspace operations (create organization, workspace)
- Health checks (API docs, Swagger)

### Test Structure

```
apps/api/
├── src/
│   ├── auth/
│   │   └── auth.service.spec.ts      # Auth service unit tests
│   ├── users/
│   │   └── users.service.spec.ts     # Users service unit tests
│   └── ...
└── test/
    ├── auth.e2e-spec.ts              # Auth e2e tests
    ├── workspaces.e2e-spec.ts        # Workspace e2e tests
    └── health.e2e-spec.ts             # Health check tests
```

## Frontend Testing

### Unit Tests

Frontend tests use Vitest and React Testing Library.

**Run frontend tests:**
```bash
cd apps/web
npm run test
```

**Run with UI:**
```bash
cd apps/web
npm run test:ui
```

## Test Best Practices

1. **Unit Tests**: Test individual services and functions in isolation
2. **Integration Tests**: Test module interactions
3. **E2E Tests**: Test complete user flows
4. **Mock External Dependencies**: Use mocks for databases, external APIs
5. **Test Coverage**: Aim for >80% coverage on critical paths

## Writing New Tests

### Backend Unit Test Example

```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let mockModel: any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ServiceName,
        {
          provide: getModelToken(ModelName.name),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more tests...
});
```

### E2E Test Example

```typescript
describe('Feature (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    // Setup test data...
  });

  afterAll(async () => {
    await app.close();
  });

  it('should perform action', () => {
    return request(app.getHttpServer())
      .get('/api/endpoint')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });
});
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Manual workflow triggers

See `.github/workflows/ci.yml` for CI configuration.

## Performance Testing

The application includes performance monitoring:
- Request timing logs
- Slow request warnings (>1s)
- Very slow request errors (>5s)
- Performance decorators for critical methods

## Coverage Goals

- **Critical Services**: >90% coverage
- **Controllers**: >80% coverage
- **Services**: >80% coverage
- **Overall**: >75% coverage
