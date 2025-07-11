#!/bin/bash

# Script to start the Healthcare MCP Server
echo "Starting Healthcare MCP Server..."

# Navigate to the MCP server directory
cd ../ai-assited-healthcare

# Check if Python virtual environment exists
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Check if requirements are installed
if [ ! -f ".venv/lib/python*/site-packages/fastmcp/__init__.py" ]; then
    echo "Installing Python dependencies..."
    pip install -r requirements.txt || pip install fastmcp pandas supabase
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. Please create one with your Supabase credentials."
    echo "Required variables: SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY"
    echo ""
fi

# Start the MCP server
echo "Starting MCP server on port 3001..."
python main.py

echo "MCP server stopped." 