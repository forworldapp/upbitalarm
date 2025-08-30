#!/bin/bash
echo "🚀 Starting Upbit Alarm Server..."
echo "📍 Server will be accessible at:"
echo "   - http://localhost:3000 (if on same machine)"
echo "   - http://$(hostname -I | cut -d' ' -f1):3000 (WSL IP)"
echo "   - http://$(ip route | grep default | grep -o '[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}' | head -1 | sed 's/\.[0-9]*$/.1/'):3000 (Windows from WSL)"
echo ""

# 테스트 데이터 추가
echo "🔄 Adding test data..."
npx tsx add-test-data.ts

echo ""
echo "🖥️  Starting web server on port 3000..."
echo "📱 Frontend dashboard will be available shortly..."
echo "⚡ Real-time monitoring is active (checks every 30 seconds)"
echo ""

HOST=0.0.0.0 PORT=3000 npm run dev