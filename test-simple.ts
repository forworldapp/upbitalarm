// 단순한 공지 파싱 테스트
import { announcementMonitor } from './server/services/announcementMonitor';

console.log("🔔 Testing announcement monitoring...");
await announcementMonitor.checkUpbitAnnouncements();
console.log("✅ Test completed");