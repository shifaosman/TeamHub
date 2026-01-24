# Deployment Guide

## Production Deployment

### Prerequisites

- Docker and Docker Compose installed
- AWS S3 bucket (or use local storage)
- Domain name (optional)
- SSL certificate (for HTTPS)

### Environment Variables

#### API (.env)

```env
NODE_ENV=production
PORT=3000

MONGODB_URI=mongodb://your-mongo-connection-string
REDIS_HOST=your-redis-host
REDIS_PORT=6379

JWT_SECRET=your-very-secure-secret-key
JWT_REFRESH_SECRET=your-very-secure-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
USE_LOCAL_STORAGE=false

APP_URL=https://your-domain.com
API_URL=https://api.your-domain.com
```

#### Web (.env)

```env
VITE_API_URL=https://api.your-domain.com/api
VITE_WS_URL=wss://api.your-domain.com
```

### Docker Deployment

1. **Build and start services:**

```bash
docker-compose -f docker-compose.prod.yml up -d
```

2. **Seed initial data:**

```bash
docker-compose exec api npm run seed
```

3. **View logs:**

```bash
docker-compose logs -f
```

### Manual Deployment

#### Backend (NestJS)

1. Install dependencies:
```bash
cd apps/api
npm ci --production
```

2. Build:
```bash
npm run build
```

3. Start:
```bash
npm run start:prod
```

#### Frontend (React)

1. Install dependencies:
```bash
cd apps/web
npm ci
```

2. Build:
```bash
npm run build
```

3. Serve with nginx or similar:
```bash
# Copy dist/ to your web server
```

### Database Migrations

Currently, Mongoose handles schema creation automatically. For production:

1. Ensure indexes are created (handled by Mongoose)
2. Run seed script for initial data
3. Monitor database performance

### Scaling

#### Horizontal Scaling

- Use Redis adapter for Socket.io (already configured)
- Use MongoDB replica set
- Use Redis cluster for high availability
- Load balance API instances

#### Vertical Scaling

- Increase MongoDB memory
- Increase Redis memory
- Optimize Node.js memory limits

### Monitoring

- Set up application monitoring (e.g., Sentry, New Relic)
- Monitor MongoDB performance
- Monitor Redis memory usage
- Set up log aggregation (e.g., ELK stack)

### Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable helmet security headers
- [ ] Regular security updates
- [ ] Database backups
- [ ] Environment variables secured
