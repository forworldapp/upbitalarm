// 프론트엔드 테스트용 데이터 추가
import { announcementMonitor } from './server/services/announcementMonitor';

console.log("🔄 Adding test data for frontend display...");

// 공지 모니터링을 실행하여 테스트 데이터 생성
await announcementMonitor.checkUpbitAnnouncements();

console.log("✅ Test data added! You can now view it in the frontend.");
console.log("📱 Frontend is available at: http://localhost:3000");
console.log("🔗 API endpoints:");
console.log("   - GET /api/listings - All listings");
console.log("   - GET /api/listings/recent - Recent listings");
console.log("   - GET /api/dashboard/stats - Dashboard statistics");