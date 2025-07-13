#!/bin/bash

# 🚀 Railway Deployment Script for Healthcare MCP Server
# This script helps you deploy your MCP server to Railway

echo "🏥 Healthcare MCP Server - Railway Deployment"
echo "=============================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway:"
    railway login
fi

# Navigate to MCP server directory
cd ai-assited-healthcare-mcp

echo "📦 Preparing deployment..."

# Check if all required files exist
required_files=("railway.json" "Procfile" "requirements.txt" "main.py")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    fi
done

echo "✅ All required files found"

# Check environment variables
echo "🔧 Checking environment variables..."
if [ -z "$SUPABASE_URL" ]; then
    echo "⚠️  SUPABASE_URL not set. Please set it in Railway dashboard."
fi

if [ -z "$SUPABASE_KEY" ]; then
    echo "⚠️  SUPABASE_KEY not set. Please set it in Railway dashboard."
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "⚠️  SUPABASE_SERVICE_ROLE_KEY not set. Please set it in Railway dashboard."
fi

echo ""
echo "🚀 Deploying to Railway..."

# Deploy to Railway
railway up

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔗 Your MCP server should be available at:"
echo "   https://your-app-name.railway.app/mcp/"
echo ""
echo "🧪 Test your deployment:"
echo "   curl https://your-app-name.railway.app/health"
echo ""
echo "📊 View logs:"
echo "   railway logs"
echo ""
echo "🎉 Your Healthcare MCP Server is now live!"