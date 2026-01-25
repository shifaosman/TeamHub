FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
FROM base AS dependencies
COPY package*.json ./
COPY tsconfig.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci --include=dev

# Build shared package
FROM dependencies AS build-shared
COPY packages/shared ./packages/shared
RUN npm run build --workspace=packages/shared

# Build API
FROM build-shared AS build
COPY apps/api ./apps/api
RUN npm run build --workspace=apps/api

# Production
FROM base AS production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/main.js"]
