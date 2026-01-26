# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Services
```bash
# Start MongoDB and Redis
npm run docker:up

# Start API and Web (in separate terminals or use npm run dev)
npm run dev
```

### 3. Seed Demo Data
```bash
npm run seed
```

### 4. Access the App
- **Frontend**: http://localhost:5173
- **API**: http://localhost:2000
- **API Docs**: http://localhost:2000/docs

### 5. Login
```
Email: admin@teamhub.demo
Password: Admin123!
```

## 📝 Environment Setup

### Backend (`apps/api/.env`)
```env
NODE_ENV=development
PORT=2000
MONGODB_URI=mongodb://admin:admin123@localhost:27017/teamhub?authSource=admin
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
USE_LOCAL_STORAGE=true
APP_URL=http://localhost:5173
API_URL=http://localhost:2000
```

### Frontend (`apps/web/.env`)
```env
VITE_API_URL=http://localhost:2000/api
VITE_WS_URL=ws://localhost:2000
```

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start both API and Web
npm run dev:api          # Start only API
npm run dev:web          # Start only Web

# Database
npm run seed             # Seed demo data

# Docker
npm run docker:up        # Start all services
npm run docker:down      # Stop all services

# Testing
npm run test             # Run all tests
npm run test:api         # Run API tests
npm run test:web         # Run Web tests

# Building
npm run build            # Build all apps
```

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :2000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:2000 | xargs kill -9
```

**MongoDB not connecting:**
- Check Docker: `docker ps`
- Verify connection string in `.env`
- Check MongoDB is running: `docker-compose ps`

**Frontend not loading:**
- Check API is running on port 2000
- Verify `VITE_API_URL` in `apps/web/.env`
- Check browser console for errors

## 📚 Next Steps

1. Read [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed setup
2. Check [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) for production config
3. Review [ENHANCEMENT_ROADMAP.md](./ENHANCEMENT_ROADMAP.md) for ideas
