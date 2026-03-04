#!/bin/sh
set -e

echo "========================================="
echo "  TCS Plan of Correction — Starting..."
echo "========================================="

# Create .env files from environment variable
if [ -n "$OPENAI_API_KEY" ]; then
  echo "OPENAI_API_KEY=$OPENAI_API_KEY" > /app/server/.env
  echo "OPENAI_API_KEY=$OPENAI_API_KEY" > /app/user-app/server/.env
  echo "[OK] OpenAI API key configured"
else
  echo "[WARN] OPENAI_API_KEY not set — AI features will not work"
fi

# Seed admin templates if DB is fresh
cd /app/server
if [ ! -f /app/server/data/templates.db ]; then
  echo "[Init] Seeding admin templates..."
  node src/seed.js 2>/dev/null || true
fi

# Start Admin API (port 3001)
echo "[Starting] Admin API on port 3001..."
node src/index.js &

# Start User App API (port 3002)
cd /app/user-app/server
echo "[Starting] User App API on port 3002..."
node src/index.js &

# Wait for backends to be ready
sleep 2

# Start Nginx (port 7867)
echo "[Starting] Nginx on port 7867..."
echo ""
echo "========================================="
echo "  Ready!"
echo "  Plan of Correction:    http://localhost:7867"
echo "  Template Repository:   http://localhost:7867/admin/"
echo "========================================="

nginx -g 'daemon off;'
