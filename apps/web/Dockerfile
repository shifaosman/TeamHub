FROM node:18-alpine AS base

WORKDIR /app

# Install dependencies
FROM base AS dependencies
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci

# Build shared package
FROM dependencies AS build-shared
COPY packages/shared ./packages/shared
RUN npm run build --workspace=packages/shared

# Build web app
FROM build-shared AS build
COPY apps/web ./apps/web
RUN npm run build --workspace=apps/web

# Production
FROM nginx:alpine AS production
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
