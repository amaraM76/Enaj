#!/bin/bash

# Enaj Extension Token Helper Script
# This script helps you get the connection token for the browser extension

set -e

echo "🛡️  Enaj Extension Token Helper"
echo "================================"
echo ""

# Check if backend is running
echo "1️⃣  Checking if backend is running..."
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running on http://localhost:3001"
else
    echo "   ⚠️  Backend is not running. Starting it now..."
    cd "$(dirname "$0")/backend"
    npm start > /tmp/enaj-backend.log 2>&1 &
    BACKEND_PID=$!
    echo "   ⏳ Waiting for backend to start..."
    sleep 3

    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "   ✅ Backend started successfully (PID: $BACKEND_PID)"
    else
        echo "   ❌ Failed to start backend. Check /tmp/enaj-backend.log"
        exit 1
    fi
fi

echo ""
echo "2️⃣  Starting web app server..."

# Find an available port for the web app
WEB_PORT=8000
while nc -z localhost $WEB_PORT 2>/dev/null; do
    WEB_PORT=$((WEB_PORT + 1))
done

cd "$(dirname "$0")/web-app"
python3 -m http.server $WEB_PORT > /tmp/enaj-webapp.log 2>&1 &
WEB_PID=$!

echo "   ✅ Web app running on http://localhost:$WEB_PORT"
echo "   📝 Logs: /tmp/enaj-webapp.log"

sleep 2

echo ""
echo "3️⃣  Opening web app in your default browser..."
WEB_URL="http://localhost:$WEB_PORT/enaj-app.html"

# Try to open browser based on OS
if command -v xdg-open > /dev/null; then
    xdg-open "$WEB_URL" &
elif command -v open > /dev/null; then
    open "$WEB_URL" &
elif command -v start > /dev/null; then
    start "$WEB_URL" &
else
    echo "   ⚠️  Could not auto-open browser. Please open manually:"
    echo "   🔗 $WEB_URL"
fi

echo ""
echo "================================"
echo "📋 INSTRUCTIONS TO GET YOUR TOKEN:"
echo "================================"
echo ""
echo "1. In the web app that just opened:"
echo "   • If you're new: Complete the onboarding (select ailments & preferences)"
echo "   • If you have an account: Sign in with your email/password"
echo "   • Or: Continue as Guest"
echo ""
echo "2. On the Home screen, scroll down to:"
echo "   \"Connect browser extension\" section"
echo ""
echo "3. Click the \"Copy connection token\" button"
echo "   (Your token will be copied to clipboard)"
echo ""
echo "4. In Chrome:"
echo "   • Go to chrome://extensions/"
echo "   • Enable 'Developer mode'"
echo "   • Click 'Load unpacked'"
echo "   • Select: $(dirname "$0")/enaj-extension"
echo ""
echo "5. Click the Enaj extension icon in your toolbar"
echo "   • Click 'Link' under 'Enaj account'"
echo "   • API URL: http://localhost:3001"
echo "   • Paste your token"
echo "   • Click 'Save & connect'"
echo ""
echo "================================"
echo ""
echo "💡 Quick Token Extraction (if you've already logged in):"
echo ""
echo "Run this in your browser's DevTools console:"
echo ""
echo "  localStorage.getItem('enaj_auth_token')"
echo ""
echo "================================"
echo ""
echo "Press Ctrl+C to stop the servers when done."
echo ""

# Keep script running
trap "echo ''; echo 'Shutting down...'; kill $WEB_PID 2>/dev/null || true; exit 0" INT TERM

# Wait forever
while true; do
    sleep 1
done
