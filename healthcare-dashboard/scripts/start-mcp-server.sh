#!/bin/bash

echo "🏥 Starting Healthcare MCP Server..."

# Navigate to MCP server directory
cd "../ai-assited-healthcare" || {
    echo "❌ Error: Could not find MCP server directory"
    exit 1
}

# Check if .env exists
if [[ ! -f ".env" ]]; then
    echo "❌ Error: .env file not found in MCP server directory"
    echo "   Please run the setup script first: bash ../healthcare-dashboard/scripts/setup-supabase-integration.sh"
    exit 1
fi

# Activate virtual environment
if [[ -f ".venv/bin/activate" ]]; then
    source .venv/bin/activate
else
    echo "❌ Error: Python virtual environment not found"
    exit 1
fi

# Start the MCP server in HTTP mode
echo "🚀 Starting MCP server on port 8000..."
export MCP_PORT=8000
export MCP_HOST=0.0.0.0
python main.py
