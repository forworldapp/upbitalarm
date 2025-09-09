// 단순한 공지 모니터링 테스트 스크립트
import { announcementMonitor } from './server/services/announcementMonitor.js';

console.log("🔔 Starting announcement monitoring test...");

try {
  await announcementMonitor.monitorAll();
  console.log("✅ Announcement monitoring test completed");
} catch (error) {
  console.error("❌ Announcement monitoring test failed:", error);
}