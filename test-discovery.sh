#!/bin/bash

# Test script for AI Discovery Agent
# Runs a small discovery test with limited queries

echo "🧪 Testing AI Discovery Agent Locally"
echo ""
echo "Checking environment variables..."

# Check if API keys are set
if [ -z "$BRAVE_API_KEY" ] || [ -z "$GROQ_API_KEY" ]; then
    echo "❌ Error: API keys not set"
    echo ""
    echo "Please set the following environment variables:"
    echo "  export BRAVE_API_KEY=\"your_brave_api_key\""
    echo "  export GROQ_API_KEY=\"your_groq_api_key\""
    echo ""
    echo "You can find these in your GitHub repository secrets."
    exit 1
fi

echo "✓ Environment configured"
echo ""
echo "Running discovery agent with 1 tool per query (conservative test)..."
echo "This will search a few queries and try to find new AI tools."
echo ""
echo "Press Ctrl+C to stop at any time."
echo ""
sleep 2

# Run with just 1 tool per query for testing
node ai-discovery-agent.js 1
