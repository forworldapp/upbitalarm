#!/usr/bin/env tsx

import { announcementMonitor } from "./server/services/announcementMonitor";

console.log("🚀 Starting real announcement monitoring test...");
console.log("==========================================");

async function testRealMonitoring() {
  try {
    console.log("Testing Upbit announcement monitoring with real data...");
    
    await announcementMonitor.checkUpbitAnnouncements();
    
    console.log("✅ Monitoring test completed successfully!");
    console.log("Check the console output above for detected listings and notifications.");
    
  } catch (error) {
    console.error("❌ Error during monitoring test:", error);
  }
}

testRealMonitoring();