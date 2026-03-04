# =============================================================================
# TCS Plan of Correction — Single Docker Image
# Includes: Admin App (port 3001) + User App (port 3002) + Nginx (port 7867)
# =============================================================================

# Stage 1: Build both client apps
FROM node:20-alpine AS builder

WORKDIR /build

# Copy all source
COPY . .

# Install and build Admin Client (served at /admin/ in Docker)
WORKDIR /build/client
RUN npm ci && VITE_BASE_PATH=/admin/ npm run build

# Install and build User Client
WORKDIR /build/user-app/client
RUN npm ci && npm run build

# Stage 2: Runtime
FROM node:20-alpine

RUN apk add --no-cache nginx

WORKDIR /app

# Copy Admin server + deps
COPY server/package.json server/package-lock.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev
WORKDIR /app
COPY server/src ./server/src

# Copy User App server + deps
COPY user-app/server/package.json user-app/server/package-lock.json ./user-app/server/
WORKDIR /app/user-app/server
RUN npm ci --omit=dev
WORKDIR /app
COPY user-app/server/src ./user-app/server/src
COPY user-app/server/assets ./user-app/server/assets

# Copy built client assets
COPY --from=builder /build/client/dist ./client/dist
COPY --from=builder /build/user-app/client/dist ./user-app/client/dist

# Copy logo files to client dist directories
COPY client/tcs-logo.png ./client/dist/tcs-logo.png
COPY user-app/client/tcs-logo.png ./user-app/client/dist/tcs-logo.png

# Create data directories for SQLite
RUN mkdir -p /app/server/data /app/user-app/server/data

# Nginx config
COPY nginx.conf /etc/nginx/http.d/default.conf

# Startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 7867

CMD ["/app/start.sh"]
