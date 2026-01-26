# Production Setup Guide

This guide explains how to configure all services to make TeamHub fully functional in production.

## 🔧 Making Features "Real"

### 1. Email Notifications (SMTP)

Currently, email notifications are logged to console. To enable real emails:

#### Step 1: Install Nodemailer

```bash
cd apps/api
npm install nodemailer @types/nodemailer
```

#### Step 2: Create Email Service

Create `apps/api/src/common/services/email.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM', 'noreply@teamhub.com'),
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }
}
```

#### Step 3: Update Notifications Processor

Update `apps/api/src/notifications/notifications.processor.ts` to use EmailService.

#### Step 4: Configure SMTP in `.env`

**Gmail:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

**AWS SES:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-smtp-username
SMTP_PASS=your-aws-smtp-password
EMAIL_FROM=noreply@yourdomain.com
```

### 2. File Storage (AWS S3)

#### Step 1: Create AWS Account
1. Sign up at https://aws.amazon.com/
2. Navigate to S3 service

#### Step 2: Create S3 Bucket
1. Click "Create bucket"
2. Choose bucket name (e.g., `teamhub-files`)
3. Select region (e.g., `us-east-1`)
4. Configure permissions (block public access)
5. Create bucket

#### Step 3: Create IAM User
1. Go to IAM → Users → Create user
2. Attach policy: `AmazonS3FullAccess` (or create custom policy)
3. Create access key
4. Save Access Key ID and Secret Access Key

#### Step 4: Update `.env`
```env
USE_LOCAL_STORAGE=false
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=teamhub-files
```

### 3. Database (MongoDB Atlas)

#### Step 1: Create Account
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create free cluster (M0)

#### Step 2: Configure Database
1. Create database user
2. Whitelist IP addresses (0.0.0.0/0 for all, or your server IP)
3. Get connection string

#### Step 3: Update `.env`
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/teamhub?retryWrites=true&w=majority
```

### 4. Redis (Redis Cloud)

#### Step 1: Create Account
1. Sign up at https://redis.com/try-free/
2. Create free database

#### Step 2: Get Connection Details
1. Copy endpoint and port
2. Copy password (if set)

#### Step 3: Update `.env`
```env
REDIS_HOST=your-redis-host.redis.cloud
REDIS_PORT=12345
REDIS_PASSWORD=your-password
```

### 5. Domain and SSL

#### Step 1: Register Domain
- Use Namecheap, GoDaddy, or Cloudflare
- Point DNS to your server IP

#### Step 2: Set Up SSL with Let's Encrypt

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

**On CentOS/RHEL:**
```bash
sudo yum install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

#### Step 3: Configure Nginx

Create `/etc/nginx/sites-available/teamhub`:

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# API
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:2000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/teamhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Deployment Platforms

#### Option A: VPS (DigitalOcean, AWS EC2)

**Steps:**
1. Create droplet/instance (Ubuntu 22.04)
2. SSH into server
3. Install Docker and Docker Compose
4. Clone repository
5. Configure `.env` files
6. Run `docker-compose up -d`
7. Set up Nginx reverse proxy
8. Configure SSL

#### Option B: Railway

**Steps:**
1. Sign up at https://railway.app/
2. Connect GitHub repository
3. Add MongoDB service
4. Add Redis service
5. Configure environment variables
6. Deploy automatically

#### Option C: Render

**Steps:**
1. Sign up at https://render.com/
2. Connect GitHub repository
3. Create Web Service (API)
4. Create Static Site (Web)
5. Add MongoDB and Redis services
6. Configure environment variables

#### Option D: Heroku

**Steps:**
1. Sign up at https://heroku.com/
2. Install Heroku CLI
3. Create apps: `heroku create teamhub-api`
4. Add MongoDB Atlas addon
5. Add Redis addon
6. Configure environment variables
7. Deploy: `git push heroku main`

## 🔐 Security Checklist

- [ ] Generate strong JWT secrets (32+ characters)
- [ ] Use HTTPS (SSL certificates)
- [ ] Configure CORS properly (production URLs only)
- [ ] Enable rate limiting
- [ ] Set up firewall (UFW or cloud security groups)
- [ ] Use environment variables (never commit secrets)
- [ ] Enable database authentication
- [ ] Set up regular backups
- [ ] Monitor for security vulnerabilities
- [ ] Keep dependencies updated

## 📊 Monitoring Setup

### Application Monitoring

**Sentry (Error Tracking):**
1. Sign up at https://sentry.io/
2. Create project
3. Install SDK: `npm install @sentry/node @sentry/react`
4. Configure in code
5. Add DSN to environment variables

**New Relic (APM):**
1. Sign up at https://newrelic.com/
2. Install agent: `npm install newrelic`
3. Configure in code
4. Add license key to environment variables

### Log Aggregation

**ELK Stack (Elasticsearch, Logstash, Kibana):**
- Set up Elasticsearch cluster
- Configure Logstash to parse logs
- Use Kibana for visualization

**Alternative: CloudWatch (AWS)**
- Enable CloudWatch Logs
- Set up log groups
- Create dashboards

## 🚀 Scaling Strategies

### Horizontal Scaling

1. **Load Balancer**: Use Nginx or AWS ALB
2. **Multiple API Instances**: Run multiple API containers
3. **Redis Adapter**: Already configured for Socket.io scaling
4. **Database Replication**: MongoDB replica set

### Vertical Scaling

1. **Increase Server Resources**: More CPU/RAM
2. **Database Optimization**: Indexes, query optimization
3. **Caching**: Redis caching layer
4. **CDN**: CloudFlare or AWS CloudFront for static assets

## 📈 Performance Optimization

1. **Database Indexes**: Already implemented
2. **Query Optimization**: Use `.lean()` for read-only queries
3. **Caching**: Implement Redis caching for frequent queries
4. **Image Optimization**: Compress images before upload
5. **CDN**: Serve static assets via CDN
6. **Code Splitting**: Frontend code splitting (already with Vite)

## ✅ Production Readiness Checklist

- [ ] All environment variables configured
- [ ] Database backups configured
- [ ] File storage (S3) configured
- [ ] Email service (SMTP) configured
- [ ] SSL certificates installed
- [ ] Domain configured
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Log aggregation set up
- [ ] Security measures in place
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Firewall rules set
- [ ] Documentation updated
