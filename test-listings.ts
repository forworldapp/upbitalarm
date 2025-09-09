// 저장된 listings 확인
import { storage } from './server/storage';

console.log("📊 Checking stored listings...");
const listings = await storage.getListings();
console.log(`Found ${listings.length} listings:`);
listings.forEach(listing => {
  console.log(`- ${listing.name} (${listing.symbol}) on ${listing.exchange}`);
  if (listing.isAnnouncement) {
    console.log(`  📢 From announcement: ${listing.announcementTitle}`);
  }
  console.log(`  📅 Listed at: ${listing.listedAt}`);
  console.log('');
});