## Multi-stage build for React app
## Stage 1: Build static assets
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies using lockfile for reproducible builds
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build

## Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/build /usr/share/nginx/html

# Custom Nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Optional healthcheck
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1/ || exit 1

# Nginx base image starts nginx by default
