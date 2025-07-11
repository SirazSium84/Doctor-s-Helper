#!/bin/bash

# Test script for MCP server
SERVER_URL="http://localhost:8000/mcp/"

echo "Testing MCP Server..."

# Step 1: Initialize the session
echo "1. Initializing MCP session..."
curl -X POST $SERVER_URL \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }'

echo -e "\n\n2. Testing list_all_patients tool..."
curl -X POST $SERVER_URL \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "list_all_patients",
      "arguments": {}
    }
  }'

echo -e "\n\n3. Testing get_assessment_summary_stats tool..."
curl -X POST $SERVER_URL \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "get_assessment_summary_stats",
      "arguments": {
        "assessment_type": "phq"
      }
    }
  }'

echo -e "\n\n4. Testing identify_patients_needing_attention tool..."
curl -X POST $SERVER_URL \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "identify_patients_needing_attention",
      "arguments": {
        "risk_threshold": 0.7
      }
    }
  }'

echo -e "\n\nMCP Server test completed!"