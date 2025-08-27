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
  private upbitAnnouncementUrl = "https://upbit.com/service_center/notice";
  private bithumbAnnouncementUrl = "https://feed.bithumb.com/notice";
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
      console.log("Monitoring Upbit announcements (real scraping would be implemented here)");
      // Real implementation would scrape https://upbit.com/service_center/notice
      // or use their RSS feed if available
      return;
    } catch (error) {
      console.error("Error checking Upbit announcements:", error);
    }
  }

  async checkBithumbAnnouncements(): Promise<void> {
    try {
      console.log("Monitoring Bithumb announcements (real scraping would be implemented here)");
      // Real implementation would check Bithumb cafe announcements
      return;
    } catch (error) {
      console.error("Error checking Bithumb announcements:", error);
    }
  }

  private isListingAnnouncement(title: string): boolean {
    const listingKeywords = [
      // 업비트 키워드
      "마켓 디지털 자산 추가",
      "디지털 자산 추가", 
      "KRW 마켓 디지털 자산 추가",
      "BTC 마켓 디지털 자산 추가", 
      "USDT 마켓 디지털 자산 추가",
      "원화마켓 추가",
      "거래지원 개시",
      "거래 지원 개시",
      "신규 디지털 자산 거래",
      // 빗썸 키워드
      "원화 마켓 추가",
      "BTC 마켓 추가",
      "마켓 추가",
      "거래지원",
      "거래 개시",
      // 영어 키워드
      "Digital Asset Addition",
      "Market Addition"
    ];

    const lowerTitle = title.toLowerCase();
    return listingKeywords.some(keyword => 
      lowerTitle.includes(keyword.toLowerCase())
    );
  }

  private extractCoinFromAnnouncement(title: string): { symbol: string; name?: string } | null {
    // Patterns for both Upbit and Bithumb announcements
    const patterns = [
      // 업비트: "사이버(CYBER) KRW, USDT 마켓 디지털 자산 추가"
      /([^(]+)\(([A-Z]{2,10})\)\s*(KRW|BTC|USDT|ETH)/,
      // 빗썸: "스테이더(SD) 원화 마켓 추가"
      /([^(]+)\(([A-Z]{2,10})\)\s*원화/,
      // 일반: "비트코인(BTC)" 형태
      /([^(]+)\(([A-Z]{2,10})\)/,
      // 심볼만: "CYBER KRW 마켓"
      /^([A-Z]{2,10})\s*(KRW|BTC|USDT|원화)/
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        const symbol = match[2] || match[1];
        const name = match[2] ? match[1]?.trim() : undefined;
        
        // Filter out market indicators
        const nonCoinWords = ["KRW", "BTC", "USDT", "ETH", "USD"];
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