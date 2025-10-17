## Multi-stage build for React app
## Stage 1: Build static assets
FROM node:18-alpine AS build

# Build-time configuration
ARG APP_ENV=production
ARG BASE_URL
ARG WS_URL

WORKDIR /app

# Install dependencies using lockfile for reproducible builds
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy source and build
COPY . .

# Generate runtime config from template for the build
RUN set -eux; \
    TYPE_VAL="${APP_ENV}"; \
    BASE_VAL="${BASE_URL}"; \
    WS_VAL="${WS_URL}"; \
    if [ -f "public/config.template.js" ]; then \
      sed -e "s|__TYPE__|${TYPE_VAL}|g" \
          -e "s|__BASE_URL__|${BASE_VAL}|g" \
          -e "s|__WS_URL__|${WS_VAL}|g" public/config.template.js > public/config.js; \
    fi; \
    npm run build

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
