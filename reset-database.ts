#!/usr/bin/env tsx

import { storage } from "./server/storage";

console.log("🗑️ 데이터베이스 초기화 중...");

async function resetDatabase() {
  try {
    const listings = await storage.getListings();
    console.log(`현재 ${listings.length}개의 기록이 있습니다.`);
    
    // 모든 기록 삭제
    for (const listing of listings) {
      try {
        await storage.deleteListing(listing.id);
      } catch (error) {
        console.log(`기록 삭제 중 오류 (ID: ${listing.id}):`, error.message);
      }
    }
    
    console.log("✅ 데이터베이스가 초기화되었습니다.");
    console.log("💡 이제 실제 신규 상장만 감지됩니다.");
    
  } catch (error) {
    console.error("❌ 데이터베이스 초기화 실패:", error);
  }
}

resetDatabase();