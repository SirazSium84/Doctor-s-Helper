#!/bin/bash

echo "🏥 Starting Healthcare Dashboard with MCP Server"
echo "==============================================="

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set up cleanup trap
trap cleanup SIGINT SIGTERM

# Start MCP server in background
echo "🚀 Starting MCP server..."
bash scripts/start-mcp-server.sh &
MCP_PID=$!

# Wait a moment for MCP server to start
sleep 3

# Start dashboard
echo "🚀 Starting dashboard..."
pnpm run dev &
DASHBOARD_PID=$!

echo ""
echo "✅ Both servers are running:"
echo "   📊 Dashboard: http://localhost:3000"
echo "   🔧 MCP Server: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait
