#!/usr/bin/env tsx

const TELEGRAM_BOT_TOKEN = "1375558031:AAFKONCRVHCW3VwzAt-wJimtMS__aUGFd7w";

async function getTelegramChatId() {
  try {
    console.log("📱 텔레그램 봇과 채팅 ID를 가져오는 중...");
    console.log("📝 먼저 텔레그램에서 @teltestuser1_bot에게 메시지를 보내주세요.");
    console.log("   예: /start 또는 아무 메시지나");
    console.log("");

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`텔레그램 API 오류: ${data.description}`);
    }

    if (data.result.length === 0) {
      console.log("❌ 메시지를 찾을 수 없습니다.");
      console.log("📱 텔레그램에서 @teltestuser1_bot에게 메시지를 먼저 보내주세요.");
      return;
    }

    console.log("✅ 텔레그램 메시지 발견!");
    
    const latestUpdate = data.result[data.result.length - 1];
    const chatId = latestUpdate.message?.chat?.id;
    const firstName = latestUpdate.message?.chat?.first_name;
    const username = latestUpdate.message?.chat?.username;

    if (chatId) {
      console.log(`🆔 Chat ID: ${chatId}`);
      console.log(`👤 이름: ${firstName || 'N/A'}`);
      console.log(`🔗 사용자명: ${username ? '@' + username : 'N/A'}`);
      console.log("");
      console.log("💡 이 Chat ID를 .env 파일의 TELEGRAM_CHAT_ID에 설정하세요:");
      console.log(`TELEGRAM_CHAT_ID=${chatId}`);

      // Test message send
      console.log("\n📤 테스트 메시지를 전송합니다...");
      const testResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '🤖 업비트 상장 알림 봇이 성공적으로 연결되었습니다!\n\n✅ 이제 새로운 코인 상장 시 즉시 알림을 받을 수 있습니다.',
          parse_mode: 'Markdown'
        })
      });

      if (testResponse.ok) {
        console.log("✅ 테스트 메시지 전송 성공!");
      } else {
        console.log("❌ 테스트 메시지 전송 실패");
      }

      return chatId;
    } else {
      console.log("❌ Chat ID를 찾을 수 없습니다.");
    }

  } catch (error) {
    console.error("❌ 오류:", error.message);
  }
}

getTelegramChatId();