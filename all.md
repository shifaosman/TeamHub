# TeamHub

A production-ready collaboration platform combining Slack-style messaging with Notion-lite collaborative notes. Built with modern technologies and best practices for scalability, security, and developer experience.

> **Perfect for portfolios**: This project demonstrates full-stack development skills, real-time systems, microservices architecture, and production-ready code quality.

## 📖 Documentation Index

| Document | Description |
|----------|-------------|
| **[QUICK_START.md](./QUICK_START.md)** | Get started in 5 minutes |
| **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** | Complete setup with all environment variables |
| **[PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)** | Production services configuration (S3, SMTP, MongoDB Atlas, etc.) |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Deployment strategies and best practices |
| **[TESTING.md](./TESTING.md)** | Testing guide and best practices |
| **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** | Current project status and completed features |
| **[ENHANCEMENT_ROADMAP.md](./ENHANCEMENT_ROADMAP.md)** | Ideas to make the project bigger and more impressive |

## 🚀 Features

### Core Features
- **Real-time Chat**: Channels, DMs, threads, reactions, mentions with Socket.io
- **Workspaces & Organizations**: Multi-tenant architecture with RBAC (Owner/Admin/Member/Guest)
- **File Sharing**: S3-compatible storage with previews, local dev fallback
- **Notifications**: In-app + email notifications with user preferences
- **Search**: Full-text message search with filters (channel, user, date, file, link)
- **Notion-lite Notes**: Real-time collaborative editing with version history
- **Presence & Typing**: Real-time online status and typing indicators
- **Audit Logs**: Track admin actions and workspace changes

### Advanced Features
- **Command Palette**: Global search (Ctrl/Cmd+K) for quick navigation
- **Message Threading**: Reply to messages and organize discussions
- **Message Reactions**: Emoji reactions on messages
- **Pinned Messages**: Pin important messages in channels
- **Bookmarks**: Save messages for later
- **Version History**: Track changes in collaborative notes
- **Comments**: Add comments to notes for discussions
- **File Previews**: Preview images, videos, documents, and audio files

## 📋 Tech Stack

### Frontend
- **React 18** + **TypeScript** - Modern UI framework with type safety
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** + **shadcn/ui** - Utility-first CSS and component library
- **React Router** - Client-side routing
- **TanStack Query** - Server state management and caching
- **Zustand** - Lightweight client state management
- **Zod** - Schema validation
- **Socket.io Client** - Real-time WebSocket communication
- **Axios** - HTTP client with interceptors

### Backend
- **NestJS** + **TypeScript** - Enterprise-grade Node.js framework
- **Socket.io** (Redis adapter) - Real-time bidirectional communication
- **MongoDB** + **Mongoose** - NoSQL database with ODM
- **Redis** - Caching, presence tracking, Socket.io adapter
- **BullMQ** - Background job processing (notifications, emails)
- **AWS S3 SDK** - File storage (with local fallback)
- **JWT** - Stateless authentication with refresh tokens
- **bcryptjs** - Password hashing
- **class-validator** - DTO validation
- **Swagger/OpenAPI** - API documentation

### Infrastructure
- **Docker** + **docker-compose** - Containerization and orchestration
- **GitHub Actions** - CI/CD pipeline
- **MongoDB** - Document database
- **Redis** - In-memory data store

## 🏗️ Project Structure

```
TeamHub/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/           # Authentication module
│   │   │   ├── users/           # User management
│   │   │   ├── workspaces/      # Workspaces & organizations
│   │   │   ├── channels/        # Channel management
│   │   │   ├── messages/        # Message CRUD & operations
│   │   │   ├── notifications/   # Notification system
│   │   │   ├── files/           # File upload & storage
│   │   │   ├── notes/           # Collaborative notes
│   │   │   ├── search/           # Search functionality
│   │   │   ├── gateway/          # Socket.io gateway
│   │   │   ├── common/           # Shared utilities, guards, filters
│   │   │   └── main.ts          # Application entry point
│   │   ├── test/                # E2E tests
│   │   └── Dockerfile
│   └── web/                     # React frontend
│       ├── src/
│       │   ├── components/      # React components
│       │   ├── pages/           # Page components
│       │   ├── hooks/           # Custom React hooks
│       │   ├── contexts/        # React contexts
│       │   ├── stores/          # Zustand stores
│       │   ├── lib/             # Utilities & API client
│       │   └── App.tsx          # Root component
│       └── Dockerfile
├── packages/
│   └── shared/                  # Shared TypeScript types & Zod schemas
├── docker-compose.yml           # Docker services configuration
└── package.json                 # Monorepo root configuration
```

## 🎯 How It Works

### Architecture Overview

TeamHub follows a **monorepo architecture** with clear separation between frontend and backend:

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   React     │ ◄─────► │   NestJS    │ ◄─────► │  MongoDB    │
│  Frontend   │  REST   │   Backend   │  ODM    │  Database   │
│  (Vite)     │         │  (Express)  │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
      │                        │                        │
      │                        │                        │
      │ WebSocket              │                        │
      │ (Socket.io)            │                        │
      │                        │                        │
      ▼                        ▼                        ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Socket.io  │         │    Redis    │         │  AWS S3 /   │
│   Client    │         │  (Adapter)  │         │  Local FS   │
└─────────────┘         └─────────────┘         └─────────────┘
```

**Components:**
1. **Frontend (React)**: SPA that communicates with the API via REST and WebSockets
2. **Backend (NestJS)**: RESTful API with real-time capabilities via Socket.io
3. **Database (MongoDB)**: Stores all application data (users, workspaces, messages, etc.)
4. **Redis**: Handles caching, presence tracking, and Socket.io adapter for scaling
5. **File Storage**: AWS S3 for production, local filesystem for development
6. **BullMQ**: Background job processing (email notifications, file processing)

### Data Flow

#### Authentication Flow
```
User Login → API validates → JWT tokens → Frontend stores → 
All requests include token → Auto-refresh on expiry
```

1. User submits login form → API validates credentials with bcrypt
2. API generates JWT access token (15min) + refresh token (7days)
3. Frontend stores tokens in localStorage
4. All API requests include access token in `Authorization: Bearer <token>` header
5. On 401 error, frontend automatically refreshes token using refresh token
6. User remains authenticated seamlessly

#### Real-time Messaging Flow
```
User types message → Frontend sends via Socket.io → 
API saves to MongoDB → API emits to channel room → 
All clients in room receive → UI updates instantly
```

1. User types and sends message → Frontend emits `message:create` via Socket.io
2. API receives event → Validates and sanitizes content
3. API saves message to MongoDB
4. API emits `message:new` to all clients in `channel:<channelId>` room
5. All connected clients receive event instantly
6. Frontend updates message list without page refresh
7. Typing indicators shown with debouncing

#### File Upload Flow
```
User selects file → FormData created → API validates → 
Storage (S3/Local) → Database record → URL returned → 
Frontend displays preview
```

1. User selects file → Frontend creates FormData with file + metadata
2. File uploaded to `/api/files/upload` endpoint
3. API validates file (size < 50MB, allowed MIME types)
4. API stores file in S3 (production) or local `./uploads` (development)
5. API creates file record in MongoDB with metadata
6. File URL returned to frontend
7. Frontend displays file preview (image, video, document, etc.)

#### Search Flow
```
User searches → API queries MongoDB → 
Text index search → Filters applied → 
Results ranked → Frontend displays
```

1. User enters search query → Frontend sends to `/api/search/global`
2. API uses MongoDB text indexes for fast search
3. Filters applied (channel, user, date, file, link)
4. Results ranked by relevance score
5. Frontend displays results in command palette
6. User navigates to selected result

### Key Components

#### Backend Modules
- **Auth Module**: Handles registration, login, JWT tokens, sessions
- **Workspaces Module**: Organizations, workspaces, members, invites, RBAC
- **Channels Module**: Channel CRUD, members, privacy settings
- **Messages Module**: Message CRUD, threads, reactions, search
- **Notifications Module**: In-app notifications, email queue, preferences
- **Files Module**: Upload, storage, preview, access control
- **Notes Module**: Collaborative notes, versioning, comments
- **Search Module**: Full-text search with MongoDB aggregation
- **Gateway Module**: Socket.io real-time events

#### Frontend Components
- **AuthContext**: Manages user authentication state
- **WorkspaceStore**: Zustand store for current workspace
- **Socket Hook**: Manages WebSocket connection
- **React Query Hooks**: Data fetching and caching
- **Command Palette**: Global search and navigation
- **Notification Center**: In-app notification display

## 🚦 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** & **Docker Compose** (for easy setup)
- **MongoDB** (if running without Docker)
- **Redis** (if running without Docker)

### Option 1: Docker Setup (Recommended)

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd TeamHub
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
```bash
# Copy example files (if they exist) or create .env files
# See "Environment Configuration" section below
```

4. **Start all services:**
```bash
npm run docker:up
```

This starts:
- **MongoDB** on port `27017`
- **Redis** on port `6379`
- **API** on port `2000`
- **Web** on port `5173`

5. **Seed demo data:**
```bash
npm run seed
```

6. **Access the application:**
- **Frontend**: http://localhost:5173
- **API**: http://localhost:2000
- **API Docs (Swagger)**: http://localhost:2000/docs

### Option 2: Local Development (Without Docker)

1. **Install dependencies:**
```bash
npm install
```

2. **Start MongoDB and Redis:**
```bash
# Using Docker for just databases
docker-compose up -d mongo redis

# OR install MongoDB and Redis locally
```

3. **Configure environment variables** (see below)

4. **Start development servers:**
```bash
# Start both API and Web
npm run dev

# OR start separately
npm run dev:api  # Terminal 1
npm run dev:web  # Terminal 2
```

5. **Seed demo data:**
```bash
npm run seed
```

## ⚙️ Environment Configuration

> **Quick Setup**: Copy the example files and modify as needed:
> ```bash
> cp apps/api/.env.example apps/api/.env
> cp apps/web/.env.example apps/web/.env
> ```

### Backend Environment (`apps/api/.env`)

Create or edit `apps/api/.env` with the following variables:

```env
# Application
NODE_ENV=development
PORT=2000

# Database
MONGODB_URI=mongodb://admin:admin123@localhost:27017/teamhub?authSource=admin
# For Docker: mongodb://admin:admin123@mongo:27017/teamhub?authSource=admin

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
# For Docker: REDIS_HOST=redis

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# File Storage
USE_LOCAL_STORAGE=true
LOCAL_STORAGE_PATH=./uploads

# AWS S3 (for production)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET=your-bucket-name
S3_ENDPOINT=  # Optional: for S3-compatible services (e.g., DigitalOcean Spaces)

# Application URLs
APP_URL=http://localhost:5173
API_URL=http://localhost:2000

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

### Frontend Environment (`apps/web/.env`)

Create `apps/web/.env` with:

```env
# API Configuration
VITE_API_URL=http://localhost:2000/api
VITE_WS_URL=ws://localhost:2000
```

### Production Environment Variables

> **Important**: For production, you MUST configure real services. See [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) for detailed instructions.

For production deployment, update these values:

```env
# Backend
NODE_ENV=production
PORT=2000
MONGODB_URI=mongodb://user:password@your-mongo-host:27017/teamhub?authSource=admin
REDIS_HOST=your-redis-host
REDIS_PORT=6379
JWT_SECRET=<generate-strong-random-secret>
JWT_REFRESH_SECRET=<generate-strong-random-secret>
USE_LOCAL_STORAGE=false
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
AWS_S3_BUCKET=<your-bucket-name>
APP_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com

# Frontend
VITE_API_URL=https://api.yourdomain.com/api
VITE_WS_URL=wss://api.yourdomain.com
```

## 🔑 Demo Credentials

After running the seed script (`npm run seed`), use these credentials to log in:

**Admin User:**
```
Email: admin@teamhub.demo
Password: Admin123!
```
- Full access to all features
- Can create organizations and workspaces
- Can manage members and permissions

**Member User:**
```
Email: member@teamhub.demo
Password: Member123!
```
- Standard member access
- Can join workspaces
- Can create channels and messages

**What the seed script creates:**
- ✅ Demo Organization ("Demo Organization")
- ✅ General Workspace ("General Workspace")
- ✅ Both demo users with proper workspace memberships
- ✅ Ready-to-use workspace for testing

## 📝 Development

### Available Scripts

**Root Level:**
```bash
npm run dev          # Start both API and Web in development mode
npm run dev:api      # Start only API server
npm run dev:web      # Start only Web server
npm run build        # Build all apps for production
npm run build:api    # Build only API
npm run build:web    # Build only Web
npm run test         # Run all tests
npm run test:api     # Run API tests
npm run test:web     # Run Web tests
npm run lint         # Lint all code
npm run lint:fix     # Fix linting issues
npm run seed         # Seed database with demo data
npm run docker:up    # Start all Docker services
npm run docker:down   # Stop all Docker services
npm run docker:build  # Rebuild Docker containers
```

**API Scripts:**
```bash
cd apps/api
npm run dev          # Start with hot reload
npm run build        # Build for production
npm run start:prod   # Start production server
npm run test         # Run unit tests
npm run test:e2e     # Run e2e tests
npm run test:cov     # Run tests with coverage
npm run seed         # Seed demo data
```

**Web Scripts:**
```bash
cd apps/web
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Lint code
```

### Development Workflow

1. **Start services:**
   ```bash
   npm run docker:up  # Start MongoDB and Redis
   npm run dev        # Start API and Web
   ```

2. **Make changes:**
   - Backend: Changes auto-reload with `nest start --watch`
   - Frontend: Changes hot-reload with Vite

3. **Test changes:**
   ```bash
   npm run test       # Run tests
   npm run lint       # Check code quality
   ```

4. **Seed data (if needed):**
   ```bash
   npm run seed
   ```

## 🧪 Testing

### Backend Tests

```bash
# Unit tests
cd apps/api
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:cov
```

### Frontend Tests

```bash
cd apps/web
npm run test
npm run test:ui  # Visual test UI
```

### Test Coverage

- **Auth Service**: Unit tests for authentication logic
- **Users Service**: Unit tests for user management
- **E2E Tests**: Authentication flow, workspace operations, health checks

## 🐳 Docker

### Docker Commands

```bash
# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# Rebuild containers
npm run docker:build

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f web
```

### Docker Services

- **mongo**: MongoDB database
- **redis**: Redis cache and message broker
- **api**: NestJS backend API
- **web**: React frontend

## 📚 API Documentation

Swagger/OpenAPI documentation is available at `/docs` when the API is running.

**Access:** http://localhost:2000/docs

**Features:**
- Complete API endpoint documentation
- Request/response schemas
- Authentication examples
- Try-it-out functionality
- All endpoints tagged and organized

**API Endpoints Overview:**
- **Auth**: `/api/auth/*` - Registration, login, refresh, logout
- **Users**: `/api/users/*` - User management
- **Workspaces**: `/api/workspaces/*` - Organizations and workspaces
- **Channels**: `/api/channels/*` - Channel management
- **Messages**: `/api/messages/*` - Message operations
- **Notifications**: `/api/notifications/*` - Notification management
- **Files**: `/api/files/*` - File upload and management
- **Notes**: `/api/notes/*` - Collaborative notes
- **Search**: `/api/search/*` - Search functionality

## 🔐 Security Features

- **JWT Authentication**: Stateless token-based auth
- **Refresh Token Rotation**: Secure token refresh mechanism
- **Password Hashing**: bcryptjs with salt rounds
- **XSS Protection**: Content sanitization for messages
- **CORS Configuration**: Configurable cross-origin settings
- **Rate Limiting**: Request throttling to prevent abuse
- **Helmet**: Security headers middleware
- **Input Validation**: class-validator for all DTOs
- **RBAC**: Role-based access control for workspaces

## 🚀 Production Deployment

### Prerequisites for Production

1. **Domain Name**: Register a domain (e.g., `teamhub.com`)
2. **SSL Certificate**: Use Let's Encrypt or your provider
3. **AWS S3 Bucket**: For file storage (or use local storage)
4. **MongoDB**: Managed MongoDB (Atlas) or self-hosted
5. **Redis**: Managed Redis (ElastiCache) or self-hosted
6. **Hosting**: VPS (DigitalOcean, AWS EC2) or Platform (Heroku, Railway)

### Production Setup Steps

1. **Configure Environment Variables:**
   - Set `NODE_ENV=production`
   - Use strong JWT secrets (generate with `openssl rand -base64 32`)
   - Configure AWS S3 credentials
   - Set production database URLs

2. **Build Applications:**
   ```bash
   npm run build
   ```

3. **Deploy:**
   - **Option A**: Use Docker Compose on VPS
   - **Option B**: Deploy to cloud platform (Heroku, Railway, etc.)
   - **Option C**: Use Kubernetes for scaling

4. **Set up Reverse Proxy:**
   - Use Nginx or Caddy to proxy requests
   - Configure SSL/TLS
   - Set up domain routing

5. **Configure DNS:**
   - Point domain to your server IP
   - Set up subdomains (e.g., `api.teamhub.com`)

6. **Monitor:**
   - Set up application monitoring (Sentry, New Relic)
   - Monitor database performance
   - Set up log aggregation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🎨 Making It Bigger: Enhancement Ideas

### Quick Wins (Easy to Add - 1-2 days each)

1. **Email Verification**
   - Add email verification on registration
   - Send verification link via SMTP
   - Block unverified users from accessing features

2. **Password Reset**
   - "Forgot Password" flow
   - Send reset link via email
   - Secure token-based reset

3. **User Profiles**
   - Profile picture uploads
   - Bio and status messages
   - Activity feed

4. **Rich Text Editor**
   - Markdown support in messages
   - Formatting toolbar
   - Code blocks with syntax highlighting

5. **Dark Mode**
   - Theme toggle
   - System preference detection
   - Persistent theme storage

### Medium Complexity (3-5 days each)

6. **Video/Audio Calls**
   - Integrate WebRTC (Daily.co, Agora, or Twilio)
   - Screen sharing capabilities
   - Recording functionality

7. **Mobile App**
   - React Native app
   - Push notifications (Firebase)
   - Offline support

8. **Advanced Analytics**
   - Usage analytics dashboard
   - Team activity reports
   - Message statistics and insights

9. **Integrations**
   - GitHub (show commits in channels)
   - Slack import/export
   - Google Calendar
   - Webhooks for external services

10. **Advanced Search**
    - Elasticsearch integration
    - Search across all content types
    - Saved searches and filters

### Advanced Features (1-2 weeks each)

11. **Customization**
    - Custom themes and colors
    - Custom emojis
    - Workspace branding

12. **Advanced Permissions**
    - Granular permission system
    - Custom roles
    - Channel-level permissions

13. **Automation**
    - Bots and custom commands
    - Automated workflows
    - Scheduled messages
    - Zapier integration

14. **Advanced Features**
    - Two-factor authentication (2FA)
    - Single Sign-On (SSO)
    - Advanced audit logs
    - Data export functionality

### Technical Enhancements

1. **Performance**
   - CDN for static assets (CloudFlare, AWS CloudFront)
   - Database query optimization
   - Advanced caching strategies
   - Image optimization pipeline

2. **Scalability**
   - Horizontal scaling with load balancer
   - Database sharding
   - Microservices architecture (optional)
   - Kubernetes deployment

3. **Monitoring & Observability**
   - Application Performance Monitoring (APM) - New Relic, Datadog
   - Error tracking - Sentry
   - Log aggregation - ELK stack, CloudWatch
   - Metrics dashboard - Grafana
   - Uptime monitoring - UptimeRobot

4. **Testing & Quality**
   - Increase test coverage to 80%+
   - Integration tests
   - Load testing (k6, Artillery)
   - E2E testing with Playwright
   - Visual regression testing

5. **Security**
   - Security audit
   - Penetration testing
   - Dependency vulnerability scanning
   - Security headers optimization
   - Rate limiting per endpoint

## 📸 Screenshots

### Dashboard
- Main workspace view with channels and notes
- Quick access to create organizations, workspaces, and channels
- Workspace selector in sidebar
- Notification bell with unread count

### Real-time Chat
- Channel messaging with real-time updates via Socket.io
- Threads and replies for organized discussions
- Message reactions (emoji)
- Message editing with history
- File attachments with previews
- Typing indicators
- User presence (online/away/busy)

### Notes
- Collaborative note editing with real-time sync
- Live cursor tracking
- Version history with restore capability
- Comments and discussions
- Folder structure (parent/child notes)

### Search
- Command palette (Ctrl/Cmd+K) for quick navigation
- Search messages, channels, and users
- Advanced filters (date, file, link, channel, user)
- Keyboard navigation

### Notifications
- In-app notification center
- Real-time notification updates
- Notification preferences (all, mentions, none)
- Unread count badges

<!-- Add actual screenshots here when available -->

## 📖 Documentation Index

| Document | Description |
|----------|-------------|
| **[QUICK_START.md](./QUICK_START.md)** | Get started in 5 minutes |
| **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** | Complete setup with all environment variables |
| **[PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)** | Production services configuration (S3, SMTP, MongoDB Atlas, etc.) |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Deployment strategies and best practices |
| **[TESTING.md](./TESTING.md)** | Testing guide and best practices |
| **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** | Current project status and completed features |
| **[ENHANCEMENT_ROADMAP.md](./ENHANCEMENT_ROADMAP.md)** | Ideas to make the project bigger and more impressive |

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## 📄 License

MIT

## 🙏 Acknowledgments

- Built with [NestJS](https://nestjs.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
