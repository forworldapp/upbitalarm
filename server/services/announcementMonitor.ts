import { storage } from "../storage";
import { type InsertListing } from "@shared/schema";
import { notificationService } from "./notificationService";

interface UpbitAnnouncement {
  id: number;
  title: string;
  category: string;
  created_at: string;
  url: string;
}

interface BithumbAnnouncement {
  seq: number;
  title: string;
  type: string;
  regDttm: string;
  url: string;
}

export class AnnouncementMonitor {
  private upbitAnnouncementUrl = "https://api-manager.upbit.com/api/v1/notices";
  private bithumbAnnouncementUrl = "https://cafe.bithumb.com";
  private knownAnnouncements: Set<string> = new Set();

  constructor() {
    this.initializeKnownAnnouncements();
  }

  private async initializeKnownAnnouncements() {
    try {
      // Load known announcements from storage to avoid duplicate alerts
      const existingListings = await storage.getListings();
      existingListings.forEach(listing => {
        if (listing.announcementId) {
          this.knownAnnouncements.add(listing.announcementId);
        }
      });
    } catch (error) {
      console.error("Failed to initialize known announcements:", error);
    }
  }

  async checkUpbitAnnouncements(): Promise<void> {
    try {
      console.log("Checking Upbit announcements...");
      
      // Check Upbit notices page for new listing announcements
      const response = await fetch(`${this.upbitAnnouncementUrl}?page=1&per_page=20`);
      
      if (!response.ok) {
        throw new Error(`Upbit announcements API error: ${response.status}`);
      }

      const data = await response.json();
      const announcements: UpbitAnnouncement[] = data.data?.list || [];

      for (const announcement of announcements) {
        // Check if this is a listing announcement
        if (this.isListingAnnouncement(announcement.title)) {
          const announcementKey = `upbit:${announcement.id}`;
          
          if (!this.knownAnnouncements.has(announcementKey)) {
            console.log(`🚨 NEW UPBIT LISTING ANNOUNCEMENT: ${announcement.title}`);
            
            // Extract coin symbol from announcement title
            const coinInfo = this.extractCoinFromAnnouncement(announcement.title);
            
            if (coinInfo) {
              // Create a listing entry for the announcement
              const listing: InsertListing = {
                symbol: coinInfo.symbol,
                name: coinInfo.name || coinInfo.symbol,
                exchange: "upbit",
                marketId: `ANNOUNCEMENT-${coinInfo.symbol}`,
                listedAt: new Date(announcement.created_at),
                announcementId: announcementKey,
                announcementTitle: announcement.title,
                announcementUrl: announcement.url,
                isAnnouncement: true,
              };

              await storage.createListing(listing);
              this.knownAnnouncements.add(announcementKey);
              
              // Send immediate notification for announcement
              await notificationService.sendNotification(listing);
              
              console.log(`[${new Date().toISOString()}] LISTING_ANNOUNCEMENT_ALERT: UPBIT - ${coinInfo.symbol} - ${announcement.title}`);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking Upbit announcements:", error);
    }
  }

  async checkBithumbAnnouncements(): Promise<void> {
    try {
      console.log("Checking Bithumb announcements...");
      
      // For now, we'll monitor Bithumb's main announcement page
      // In the future, this could be expanded to parse their RSS or API
      
      // Placeholder for Bithumb announcement monitoring
      // Bithumb announcements are typically posted on their cafe or main site
      
    } catch (error) {
      console.error("Error checking Bithumb announcements:", error);
    }
  }

  private isListingAnnouncement(title: string): boolean {
    const listingKeywords = [
      "신규 디지털 자산 거래",
      "신규 상장",
      "원화마켓 추가",
      "BTC 마켓 추가", 
      "USDT 마켓 추가",
      "거래 지원",
      "상장 예정",
      "Digital Asset Trading",
      "New Listing",
      "Market Addition"
    ];

    const lowerTitle = title.toLowerCase();
    return listingKeywords.some(keyword => 
      lowerTitle.includes(keyword.toLowerCase())
    );
  }

  private extractCoinFromAnnouncement(title: string): { symbol: string; name?: string } | null {
    // Common patterns for extracting coin symbols from announcements
    const patterns = [
      // "비트코인 캐시(BCH) 원화마켓 거래 지원 안내"
      /([^(]+)\(([A-Z]+)\)/,
      // "BCH 거래 지원 안내"  
      /^([A-Z]{2,10})\s/,
      // "비트코인 캐시 거래 지원" - extract last word if it looks like a symbol
      /\s([A-Z]{2,10})(?:\s|$)/,
      // Look for symbols in parentheses
      /\(([A-Z]{2,10})\)/
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        const symbol = match[2] || match[1];
        const name = match[2] ? match[1]?.trim() : undefined;
        
        // Filter out common non-coin words
        const nonCoinWords = ["KRW", "BTC", "USDT", "ETH", "USD", "API", "NFT"];
        if (!nonCoinWords.includes(symbol) && symbol.length >= 2 && symbol.length <= 10) {
          return { symbol: symbol.toUpperCase(), name };
        }
      }
    }

    return null;
  }

  async monitorAll(): Promise<void> {
    console.log("Running announcement monitoring...");
    await Promise.all([
      this.checkUpbitAnnouncements(),
      this.checkBithumbAnnouncements()
    ]);
  }
}

export const announcementMonitor = new AnnouncementMonitor();