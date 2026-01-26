# Complete Setup Guide

This guide will walk you through setting up TeamHub from scratch, including all environment variables and production configuration.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Configuration](#environment-configuration)
4. [Running the Application](#running-the-application)
5. [Production Configuration](#production-configuration)
6. [Making Features "Real"](#making-features-real)

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **npm** (v9 or higher)
   - Comes with Node.js
   - Verify: `npm --version`

3. **Docker Desktop** (for easy database setup)
   - Download from: https://www.docker.com/products/docker-desktop
   - Verify: `docker --version`

### Optional (for production)

4. **Git** (for version control)
5. **MongoDB Atlas Account** (for cloud database)
6. **AWS Account** (for S3 file storage)
7. **Domain Name** (for production deployment)

## Initial Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd TeamHub

# Install all dependencies
npm install
```

### 2. Create Environment Files

```bash
# Copy example files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

## Environment Configuration

### Backend Configuration (`apps/api/.env`)

Open `apps/api/.env` and configure the following:

#### Basic Configuration

```env
NODE_ENV=development
PORT=2000
```

#### Database Configuration

**For Local Development (with Docker):**
```env
MONGODB_URI=mongodb://admin:admin123@mongo:27017/teamhub?authSource=admin
```

**For Local Development (without Docker):**
```env
MONGODB_URI=mongodb://admin:admin123@localhost:27017/teamhub?authSource=admin
```

**For MongoDB Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/teamhub?retryWrites=true&w=majority
```

#### Redis Configuration

**For Local Development (with Docker):**
```env
REDIS_HOST=redis
REDIS_PORT=6379
```

**For Local Development (without Docker):**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

**For Redis Cloud:**
```env
REDIS_HOST=your-redis-host.redis.cloud
REDIS_PORT=12345
# Add if needed: REDIS_PASSWORD=your-redis-password
```

#### JWT Secrets

**Generate strong secrets:**
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Add to `.env`:**
```env
JWT_SECRET=<generated-secret-1>
JWT_REFRESH_SECRET=<generated-secret-2>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

#### File Storage

**For Development (Local Storage):**
```env
USE_LOCAL_STORAGE=true
LOCAL_STORAGE_PATH=./uploads
```

**For Production (AWS S3):**
```env
USE_LOCAL_STORAGE=false
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-bucket-name
```

**For S3-Compatible Services (DigitalOcean Spaces, etc.):**
```env
USE_LOCAL_STORAGE=false
AWS_REGION=nyc3
AWS_ACCESS_KEY_ID=your-spaces-key
AWS_SECRET_ACCESS_KEY=your-spaces-secret
AWS_S3_BUCKET=your-space-name
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
```

#### Application URLs

**Development:**
```env
APP_URL=http://localhost:5173
API_URL=http://localhost:2000
```

**Production:**
```env
APP_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
```

### Frontend Configuration (`apps/web/.env`)

Open `apps/web/.env` and configure:

**Development:**
```env
VITE_API_URL=http://localhost:2000/api
VITE_WS_URL=ws://localhost:2000
```

**Production:**
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_WS_URL=wss://api.yourdomain.com
```

## Running the Application

### Option 1: Docker (Easiest)

```bash
# Start all services (MongoDB, Redis, API, Web)
npm run docker:up

# Seed demo data
npm run seed

# Access the app
# Frontend: http://localhost:5173
# API: http://localhost:2000
# Docs: http://localhost:2000/docs
```

### Option 2: Local Development

```bash
# Start MongoDB and Redis with Docker
docker-compose up -d mongo redis

# Start API and Web
npm run dev

# In another terminal, seed data
npm run seed
```

## Production Configuration

### Making Features "Real" - Production Setup

To make all features work in production, you need to configure:

#### 1. Email Notifications (SMTP)

**Option A: Gmail SMTP**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Generate in Google Account settings
EMAIL_FROM=noreply@yourdomain.com
```

**Option B: SendGrid**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

**Option C: AWS SES**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-smtp-username
SMTP_PASS=your-aws-smtp-password
EMAIL_FROM=noreply@yourdomain.com
```

**Update the code:**
- Modify `apps/api/src/notifications/notifications.processor.ts` to use SMTP
- Install `nodemailer`: `npm install nodemailer @types/nodemailer`

#### 2. File Storage (AWS S3)

**Steps:**
1. Create AWS account: https://aws.amazon.com/
2. Create S3 bucket: https://console.aws.amazon.com/s3/
3. Create IAM user with S3 permissions
4. Get access key and secret
5. Update `.env`:
   ```env
   USE_LOCAL_STORAGE=false
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_S3_BUCKET=your-bucket-name
   ```

**Alternative: DigitalOcean Spaces**
1. Create DigitalOcean account
2. Create Spaces bucket
3. Get access key and secret
4. Update `.env`:
   ```env
   USE_LOCAL_STORAGE=false
   AWS_REGION=nyc3
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_S3_BUCKET=your-space-name
   S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
   ```

#### 3. Database (MongoDB Atlas)

**Steps:**
1. Create account: https://www.mongodb.com/cloud/atlas
2. Create cluster (free tier available)
3. Create database user
4. Whitelist your IP address
5. Get connection string
6. Update `.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/teamhub
   ```

#### 4. Redis (Redis Cloud)

**Steps:**
1. Create account: https://redis.com/try-free/
2. Create database
3. Get connection details
4. Update `.env`:
   ```env
   REDIS_HOST=your-redis-host.redis.cloud
   REDIS_PORT=12345
   REDIS_PASSWORD=your-password
   ```

#### 5. Domain and SSL

**Steps:**
1. Register domain (Namecheap, GoDaddy, etc.)
2. Point DNS to your server IP
3. Set up SSL with Let's Encrypt:
   ```bash
   # Install Certbot
   sudo apt install certbot python3-certbot-nginx
   
   # Get certificate
   sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
   ```

#### 6. Deployment Platform Options

**Option A: VPS (DigitalOcean, AWS EC2)**
- Deploy with Docker Compose
- Use Nginx as reverse proxy
- Set up SSL with Let's Encrypt

**Option B: Railway**
- Connect GitHub repository
- Railway auto-detects and deploys
- Provides MongoDB and Redis addons

**Option C: Heroku**
- Use Heroku Postgres (MongoDB alternative) or MongoDB Atlas
- Use Heroku Redis
- Deploy with Git push

**Option D: Render**
- Connect GitHub repository
- Auto-deploy on push
- Provides MongoDB and Redis services

## Making It Bigger: Enhancement Ideas

### Quick Wins (Easy to Add)

1. **Email Verification**
   - Add email verification on registration
   - Send verification link via email
   - Block unverified users

2. **Password Reset**
   - Add "Forgot Password" flow
   - Send reset link via email
   - Reset password with token

3. **User Profiles**
   - Profile pictures (upload to S3)
   - Bio and status
   - Activity feed

4. **Rich Text Editor**
   - Add markdown support
   - Formatting toolbar
   - Code blocks with syntax highlighting

### Medium Complexity

5. **Video Calls**
   - Integrate Daily.co or Agora
   - Add "Start Call" button in channels
   - Screen sharing

6. **Mobile App**
   - React Native app
   - Push notifications
   - Offline support

7. **Advanced Analytics**
   - Usage dashboard
   - Message statistics
   - Team activity reports

### Advanced Features

8. **Integrations**
   - GitHub (show commits in channels)
   - Slack import/export
   - Google Calendar
   - Jira integration

9. **Automation**
   - Webhooks
   - Bots (custom commands)
   - Scheduled messages
   - Workflow automation

10. **Advanced Search**
    - Elasticsearch integration
    - Search across all content
    - Saved searches
    - Search history

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Windows PowerShell (as Administrator)
netstat -ano | findstr :2000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:2000 | xargs kill -9
```

**MongoDB connection failed:**
- Check MongoDB is running: `docker ps`
- Verify connection string in `.env`
- Check firewall settings

**Redis connection failed:**
- Check Redis is running: `docker ps`
- Verify REDIS_HOST in `.env`
- Test connection: `redis-cli ping`

**File upload fails:**
- Check `uploads` directory exists
- Verify file permissions
- Check file size limits

**CORS errors:**
- Verify `APP_URL` in backend `.env`
- Check `VITE_API_URL` in frontend `.env`
- Ensure URLs match exactly

## Support

For issues or questions:
1. Check the [README.md](./README.md)
2. Review [DEPLOYMENT.md](./DEPLOYMENT.md)
3. Check API documentation at `/docs`
4. Review error logs in terminal

## Next Steps

1. ✅ Complete initial setup
2. ✅ Configure environment variables
3. ✅ Run the application
4. ✅ Test all features
5. ⏭️ Configure production services (S3, SMTP, etc.)
6. ⏭️ Deploy to production
7. ⏭️ Set up monitoring
8. ⏭️ Add enhancements
