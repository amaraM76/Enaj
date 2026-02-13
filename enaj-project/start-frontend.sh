#!/bin/bash

# Enaj Frontend Startup Script

echo "🚀 Starting Enaj Frontend..."
echo ""

# Check if backend is running
echo "🔍 Checking backend status..."
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running"
else
    echo "   ⚠️  Backend is NOT running"
    echo "   💡 Start it with: cd backend && npm start"
    echo ""
    read -p "   Start backend now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "   Starting backend..."
        cd "$(dirname "$0")/backend"
        npm start > /tmp/enaj-backend.log 2>&1 &
        echo "   ✅ Backend started (logs: /tmp/enaj-backend.log)"
        sleep 3
    fi
fi

echo ""
echo "🌐 Starting web server..."

# Find available port
PORT=8000
while nc -z localhost $PORT 2>/dev/null; do
    PORT=$((PORT + 1))
done

cd "$(dirname "$0")/web-app"

echo "   ✅ Web app will run on port $PORT"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Frontend is ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Open in your browser:"
echo "   http://localhost:$PORT/enaj-app.html"
echo ""
echo "🛡️  Backend API:"
echo "   http://localhost:3001"
echo ""
echo "📝 What you can do:"
echo "   • Complete onboarding (select ailments & preferences)"
echo "   • Create an account or continue as guest"
echo "   • Copy your connection token for the extension"
echo "   • Scan products directly in the web app"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start server
python3 -m http.server $PORT
