#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Shop Ledger..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 0.5
node server.js &
SERVER_PID=$!
sleep 1
open -a "Google Chrome" http://localhost:3000
echo "✅ Running at http://localhost:3000"
echo "Close this window to stop the server."
trap "kill $SERVER_PID 2>/dev/null; echo 'Server stopped.'" EXIT
wait $SERVER_PID
