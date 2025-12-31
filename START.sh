#!/bin/bash

echo "🚀 Starting Insightify..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
    echo ""
fi

echo "✨ Launching development server..."
echo "📍 App will be available at: http://localhost:3000"
echo ""
echo "💡 Try asking the AI assistant:"
echo "   - 'Forecast revenue for next quarter'"
echo "   - 'Show me sales trends'"
echo "   - 'Give me insights on performance'"
echo ""

npm run dev
