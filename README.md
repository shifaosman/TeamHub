# TeamHub

A production-ready collaboration platform combining Slack-style messaging with Notion-lite collaborative notes.

## 🚀 Features

- **Real-time Chat**: Channels, DMs, threads, reactions, mentions
- **Workspaces & Organizations**: Multi-tenant with RBAC
- **File Sharing**: S3-compatible storage with previews
- **Notifications**: In-app + email with preferences
- **Search**: Full-text message search with filters
- **Notion-lite Notes**: Real-time collaborative editing
- **Presence & Typing**: Real-time indicators
- **Audit Logs**: Track admin actions

## 📋 Tech Stack

### Frontend
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Router
- TanStack Query
- Zustand
- Zod

### Backend
- NestJS + TypeScript
- Socket.io (Redis adapter)
- MongoDB + Mongoose
- Redis (presence, caching, Socket.io adapter)
- BullMQ (background jobs)
- AWS S3 (file storage)

### Infrastructure
- Docker + docker-compose
- GitHub Actions CI
- Swagger/OpenAPI docs

## 🏗️ Project Structure

```
TeamHub/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # React frontend
├── packages/
│   └── shared/       # Shared types & schemas
└── docker-compose.yml
```

## 🚦 Quick Start

### Prerequisites
- Node.js >= 18
- Docker & Docker Compose
- AWS S3 bucket (or use local storage for dev)

### 1. Clone & Install

```bash
npm install
```

### 2. Environment Setup

Copy example env files and configure:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### 3. Start with Docker

```bash
npm run docker:up
```

This starts:
- MongoDB (port 27017)
- Redis (port 6379)
- API (port 3000)
- Web (port 5173)

### 4. Seed Demo Data

```bash
npm run seed
```

### 5. Access the App

- **Web**: http://localhost:5173
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/docs

## 🔑 Demo Credentials

After seeding, use these credentials:

```
Email: admin@teamhub.demo
Password: Admin123!

Email: member@teamhub.demo
Password: Member123!
```

## 📝 Development

### Run Locally (without Docker)

1. Start MongoDB and Redis locally
2. Run API: `npm run dev:api`
3. Run Web: `npm run dev:web`

### Available Scripts

- `npm run dev` - Start both API and Web
- `npm run build` - Build all apps
- `npm run test` - Run all tests
- `npm run lint` - Lint all code
- `npm run seed` - Seed demo data

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run API tests
npm run test:api

# Run Web tests
npm run test:web
```

## 🐳 Docker

```bash
# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# Rebuild containers
npm run docker:build
```

## 📚 API Documentation

Swagger documentation available at `/docs` when API is running.

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.

## 📸 Screenshots

_Placeholder for screenshots_

## 📄 License

MIT
