#!/bin/bash

# BlkPages Backend Startup Script
echo "🚀 Starting BlkPages Backend..."

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found. Please run this script from the backend directory."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Please create one based on .env.example"
    echo "   The server will start but may not connect to database."
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🎯 Starting server on port ${PORT:-3001}..."
echo "📊 API + Socket.IO will be available at: http://localhost:${PORT:-3001}"
echo "🔗 Health check: http://localhost:${PORT:-3001}/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start
