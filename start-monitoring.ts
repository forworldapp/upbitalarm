#!/usr/bin/env tsx

import dotenv from 'dotenv';
import { announcementMonitor } from "./server/services/announcementMonitor";
import * as cron from 'node-cron';

// Load environment variables
dotenv.config();

console.log("🚀 업비트 실시간 상장 모니터링 시작");
console.log("================================");
console.log(`📅 시작 시간: ${new Date().toLocaleString('ko-KR')}`);
console.log("");

// Validate configuration
function validateConfig() {
  const config = {
    upbitAccessKey: process.env.UPBIT_ACCESS_KEY ? '✅ 설정됨' : '❌ 미설정',
    upbitSecretKey: process.env.UPBIT_SECRET_KEY ? '✅ 설정됨' : '❌ 미설정',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ? '✅ 설정됨' : '❌ 미설정',
    telegramChatId: process.env.TELEGRAM_CHAT_ID ? '✅ 설정됨' : '❌ 미설정'
  };

  console.log("🔧 설정 확인:");
  console.log(`   Upbit Access Key: ${config.upbitAccessKey}`);
  console.log(`   Upbit Secret Key: ${config.upbitSecretKey}`);
  console.log(`   Telegram Bot Token: ${config.telegramBotToken}`);
  console.log(`   Telegram Chat ID: ${config.telegramChatId}`);
  console.log("");

  if (!process.env.TELEGRAM_CHAT_ID) {
    console.log("⚠️  Telegram Chat ID가 설정되지 않았습니다.");
    console.log("📱 다음 명령어로 Chat ID를 먼저 설정하세요:");
    console.log("   npx tsx get-telegram-chatid.ts");
    console.log("");
  }

  return config;
}

async function runMonitoring() {
  try {
    const timestamp = new Date().toLocaleString('ko-KR');
    console.log(`[${timestamp}] 🔍 모니터링 실행 중...`);
    
    await announcementMonitor.monitorAll();
    
    console.log(`[${timestamp}] ✅ 모니터링 완료`);
    console.log("----------------------------------------");
    
  } catch (error) {
    console.error(`[${new Date().toLocaleString('ko-KR')}] ❌ 모니터링 오류:`, error);
  }
}

async function startMonitoring() {
  console.log("🔄 모니터링 스케줄러 시작...");
  
  // 즉시 한 번 실행
  console.log("🚀 초기 모니터링 실행...");
  await runMonitoring();
  
  // 1분마다 실행 (빠른 감지를 위해)
  console.log("⏰ 1분마다 자동 모니터링 시작");
  cron.schedule('* * * * *', () => {
    runMonitoring();
  });

  // 30초마다 한 번 더 체크 (더 빠른 감지)
  setInterval(() => {
    runMonitoring();
  }, 30000);

  console.log("🔔 모니터링이 백그라운드에서 실행 중입니다...");
  console.log("📊 실시간 로그를 확인하세요.");
  console.log("⏹️  중지하려면 Ctrl+C를 누르세요.");
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n');
  console.log('🛑 모니터링 중지 중...');
  console.log('👋 모니터링이 안전하게 종료되었습니다.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 모니터링 중지 중...');
  process.exit(0);
});

// Main execution
validateConfig();
startMonitoring().catch(error => {
  console.error('❌ 모니터링 시작 실패:', error);
  process.exit(1);
});