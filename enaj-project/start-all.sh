#!/bin/bash

# Start Everything - Backend + Frontend

set -e

echo "🛡️  Enaj - Starting All Services"
echo "════════════════════════════════════"
echo ""

# Navigate to project root
cd "$(dirname "$0")"

# Start Backend
echo "1️⃣  Starting Backend..."
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend already running on port 3001"
else
    echo "   ⏳ Starting backend server..."
    cd backend
    npm start > /tmp/enaj-backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..

    # Wait for backend to be ready
    for i in {1..10}; do
        if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
            echo "   ✅ Backend running (PID: $BACKEND_PID)"
            break
        fi
        sleep 1
    done
fi

echo ""

# Start Frontend
echo "2️⃣  Starting Frontend..."

# Find available port
FRONTEND_PORT=8000
while nc -z localhost $FRONTEND_PORT 2>/dev/null; do
    FRONTEND_PORT=$((FRONTEND_PORT + 1))
done

cd web-app
python3 -m http.server $FRONTEND_PORT > /tmp/enaj-frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

sleep 2

if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
    echo "   ✅ Frontend running on port $FRONTEND_PORT (PID: $FRONTEND_PID)"
else
    echo "   ❌ Failed to start frontend"
    exit 1
fi

echo ""
echo "════════════════════════════════════"
echo "✅ All Services Running!"
echo "════════════════════════════════════"
echo ""
echo "🌐 Web App:    http://localhost:$FRONTEND_PORT/enaj-app.html"
echo "🔧 Backend:    http://localhost:3001"
echo "📊 Health:     http://localhost:3001/api/health"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f /tmp/enaj-backend.log"
echo "   Frontend: tail -f /tmp/enaj-frontend.log"
echo ""
echo "════════════════════════════════════"
echo ""
echo "🎯 Next Steps:"
echo "   1. Open the web app URL above"
echo "   2. Complete onboarding or sign in"
echo "   3. Copy your connection token"
echo "   4. Install & link the browser extension"
echo ""
echo "💡 To get your token quickly:"
echo "   node get-token.js"
echo ""
echo "════════════════════════════════════"
echo ""
echo "PIDs: Backend=$BACKEND_PID, Frontend=$FRONTEND_PID"
echo ""
echo "To stop: kill $BACKEND_PID $FRONTEND_PID"
echo ""
