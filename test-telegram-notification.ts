#!/usr/bin/env tsx

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testTelegramNotification() {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  console.log("🔍 Environment variables:");
  console.log(`TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN ? 'Set' : 'Not set'}`);
  console.log(`TELEGRAM_CHAT_ID: ${TELEGRAM_CHAT_ID}`);

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("❌ Missing Telegram configuration");
    return;
  }

  try {
    const message = `🚨 *신규상장* 🔵
**CYBER** - 업비트
${new Date().toLocaleString("ko-KR", { hour: '2-digit', minute: '2-digit' })}

🧪 테스트 알림입니다!`;

    console.log("📤 Sending telegram message...");
    console.log("Message:", message);

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error("❌ Telegram API error:", response.status, responseData);
      return;
    }

    console.log("✅ Telegram notification sent successfully!");
    console.log("Response:", responseData);

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testTelegramNotification();