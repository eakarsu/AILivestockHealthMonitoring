#!/bin/bash

# AI Livestock Health Monitoring - Start Script
# This script sets up and starts the complete application

set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT=3001
FRONTEND_PORT=3000

echo "======================================"
echo "  AI Livestock Health Monitoring"
echo "  Starting Application..."
echo "======================================"

# Function to clean up on exit
cleanup() {
    echo ""
    echo "Shutting down services..."
    if [ ! -z "$BACKEND_PID" ]; then kill $BACKEND_PID 2>/dev/null || true; fi
    if [ ! -z "$FRONTEND_PID" ]; then kill $FRONTEND_PID 2>/dev/null || true; fi
    # Kill any remaining processes on our ports
    lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
    lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
    echo "All services stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Step 1: Clean used ports
echo ""
echo "[1/6] Cleaning used ports..."
lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || echo "  Port $BACKEND_PORT is free"
lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || echo "  Port $FRONTEND_PORT is free"
sleep 1

# Step 2: Check PostgreSQL
echo ""
echo "[2/6] Checking PostgreSQL..."
if ! pg_isready -q 2>/dev/null; then
    echo "  Starting PostgreSQL..."
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || {
        echo "  ERROR: PostgreSQL is not running. Please start it manually."
        exit 1
    }
    sleep 2
fi
echo "  PostgreSQL is running"

# Step 3: Create database if not exists
echo ""
echo "[3/6] Setting up database..."
createdb livestock_health 2>/dev/null || echo "  Database 'livestock_health' already exists"

# Step 4: Install dependencies
echo ""
echo "[4/6] Installing dependencies..."
cd "$APP_DIR/backend"
if [ ! -d "node_modules" ]; then
    echo "  Installing backend dependencies..."
    npm install --silent
else
    echo "  Backend dependencies already installed"
fi

cd "$APP_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "  Installing frontend dependencies..."
    npm install --silent
else
    echo "  Frontend dependencies already installed"
fi

# Step 5: Seed database
echo ""
echo "[5/6] Seeding database..."
cd "$APP_DIR/backend"
node seed.js

# Step 6: Start services with hot reload
echo ""
echo "[6/6] Starting services with hot reload..."
echo ""

# Start backend with nodemon for hot reload
cd "$APP_DIR/backend"
npx nodemon server.js &
BACKEND_PID=$!
echo "  Backend started (PID: $BACKEND_PID) on http://localhost:$BACKEND_PORT"

# Start frontend (react-scripts has built-in hot reload)
cd "$APP_DIR/frontend"
BROWSER=none PORT=$FRONTEND_PORT npm start &
FRONTEND_PID=$!
echo "  Frontend started (PID: $FRONTEND_PID) on http://localhost:$FRONTEND_PORT"

echo ""
echo "======================================"
echo "  Application is running!"
echo "  Frontend: http://localhost:$FRONTEND_PORT"
echo "  Backend:  http://localhost:$BACKEND_PORT"
echo ""
echo "  Login: admin@livestock.com / password123"
echo ""
echo "  Press Ctrl+C to stop all services"
echo "======================================"

# Wait for both processes
wait
