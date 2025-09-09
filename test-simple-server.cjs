// 간단한 테스트 서버
const express = require('express');
const path = require('path');

const app = express();
const port = 9000;

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'client')));

// API 테스트 엔드포인트
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date() });
});

// 간단한 HTML 페이지
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Upbit Alarm Test</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            .alert { background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .success { background: #d4edda; color: #155724; }
            button { padding: 10px 20px; margin: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
            #status { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Upbit Alarm System</h1>
            <div class="alert success">
                <h2>✅ Server is Running!</h2>
                <p>The backend server is successfully running on port ${port}</p>
            </div>
            
            <h2>🧪 Test Features</h2>
            <button onclick="testAPI()">Test API Connection</button>
            <button onclick="testNotification()">Test Notification</button>
            <button onclick="showListings()">Show Mock Listings</button>
            
            <div id="status">
                <h3>System Status:</h3>
                <p>🟢 Server: Online</p>
                <p>🟢 Port: ${port}</p>
                <p>🟢 Time: ${new Date().toLocaleString()}</p>
            </div>
            
            <div id="results"></div>
        </div>
        
        <script>
            async function testAPI() {
                try {
                    const response = await fetch('/api/test');
                    const data = await response.json();
                    showResult('✅ API Test Success: ' + JSON.stringify(data, null, 2));
                } catch (error) {
                    showResult('❌ API Test Failed: ' + error.message);
                }
            }
            
            function testNotification() {
                showResult('📨 Mock Notification: New listing detected for CYBER (사이버) on Upbit!');
            }
            
            function showListings() {
                const mockData = [
                    { symbol: 'CYBER', name: '사이버', exchange: 'upbit', time: '1 minute ago' },
                    { symbol: 'SD', name: '스테이더', exchange: 'upbit', time: '2 minutes ago' }
                ];
                showResult('📊 Mock Listings: ' + JSON.stringify(mockData, null, 2));
            }
            
            function showResult(message) {
                const results = document.getElementById('results');
                results.innerHTML = '<div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin-top: 20px; white-space: pre-wrap; font-family: monospace;">' + message + '</div>';
            }
            
            // Auto-refresh status every 30 seconds
            setInterval(() => {
                document.getElementById('status').innerHTML = 
                    '<h3>System Status:</h3>' +
                    '<p>🟢 Server: Online</p>' +
                    '<p>🟢 Port: ${port}</p>' +
                    '<p>🟢 Time: ' + new Date().toLocaleString() + '</p>';
            }, 30000);
        </script>
    </body>
    </html>
  `);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Test server running on port ${port}`);
  console.log(`📱 Access URLs:`);
  console.log(`   - http://localhost:${port}`);
  console.log(`   - http://127.0.0.1:${port}`);
  console.log(`   - http://172.30.217.234:${port}`);
});