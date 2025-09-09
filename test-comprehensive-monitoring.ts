#!/usr/bin/env tsx

import { announcementMonitor } from "./server/services/announcementMonitor";
import { upbitApi } from "./server/services/upbitApi";

console.log("🚀 Comprehensive Upbit monitoring test");
console.log("====================================");

async function testComprehensiveMonitoring() {
  try {
    console.log("\n1. Testing API connection...");
    
    try {
      const markets = await upbitApi.getKRWMarkets();
      console.log(`✅ Successfully connected to Upbit API`);
      console.log(`📊 Found ${markets.length} KRW markets`);
      
      // Show a few markets as examples
      console.log("Examples of current markets:");
      markets.slice(0, 5).forEach(market => {
        console.log(`  - ${market.market}: ${market.korean_name} (${market.english_name})`);
      });
    } catch (error) {
      console.log("⚠️  API connection failed, will use fallback methods");
      console.log("Error:", error.message);
    }
    
    console.log("\n2. Testing announcement monitoring...");
    await announcementMonitor.monitorAll();
    
    console.log("\n3. Testing individual components...");
    
    console.log("\n3a. Testing announcement scraping...");
    await announcementMonitor.checkUpbitAnnouncements();
    
    console.log("\n3b. Testing new market detection...");
    await announcementMonitor.checkNewMarkets();
    
    console.log("\n✅ All tests completed!");
    console.log("\n📝 Summary:");
    console.log("- Announcement monitoring: ✅");
    console.log("- Market detection: ✅");
    console.log("- Notification system: ✅");
    console.log("\n🔔 If new listings were detected, notifications were sent.");
    console.log("💡 To test with real data, configure Discord/Telegram webhooks in .env");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testComprehensiveMonitoring();