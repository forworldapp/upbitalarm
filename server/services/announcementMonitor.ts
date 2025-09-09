import { storage } from "../storage";
import { type InsertListing } from "@shared/schema";
import { notificationService } from "./notificationService";
import { upbitApi } from "./upbitApi";

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
  private knownMarkets: Set<string> = new Set();
  private isInitialized: boolean = false;

  constructor() {
    this.initializeKnownAnnouncements();
  }

  private async initializeKnownAnnouncements() {
    if (this.isInitialized) return;
    
    try {
      // Load known announcements from storage to avoid duplicate alerts
      const existingListings = await storage.getListings();
      existingListings.forEach(listing => {
        if (listing.announcementId) {
          this.knownAnnouncements.add(listing.announcementId);
        }
        if (listing.marketId) {
          this.knownMarkets.add(listing.marketId);
        }
      });

      // Initialize known markets from Upbit API only if no existing data
      if (existingListings.length === 0) {
        try {
          const markets = await upbitApi.getKRWMarkets();
          markets.forEach(market => {
            this.knownMarkets.add(market.market);
          });
          console.log(`Initialized ${this.knownMarkets.size} known markets from API`);
        } catch (error) {
          console.warn("Could not initialize markets from API:", error);
        }
      } else {
        console.log(`Loaded ${existingListings.length} existing listings from database`);
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize known announcements:", error);
    }
  }

  async checkUpbitAnnouncements(): Promise<void> {
    try {
      console.log("Monitoring Upbit announcements...");
      
      const announcements = await this.fetchUpbitAnnouncements();
      console.log(`Found ${announcements.length} announcements`);

      for (const announcement of announcements) {
        await this.processUpbitAnnouncement(announcement);
      }
    } catch (error) {
      console.error("Error checking Upbit announcements:", error);
    }
  }

  private async fetchUpbitAnnouncements(): Promise<UpbitAnnouncement[]> {
    try {
      console.log("Fetching real Upbit announcements...");
      
      const response = await fetch(this.upbitAnnouncementUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      });

      if (!response.ok) {
        console.warn("Failed to fetch real announcements, using fallback data");
        return this.getFallbackAnnouncements();
      }

      const html = await response.text();
      return this.parseUpbitAnnouncements(html);
      
    } catch (error) {
      console.warn("Error fetching real announcements, using fallback:", error);
      return this.getFallbackAnnouncements();
    }
  }

  private getFallbackAnnouncements(): UpbitAnnouncement[] {
    // 실제 운영에서는 폴백 데이터 없이 실제 공지만 처리
    console.log("No real announcements found. Waiting for actual new listings...");
    return [];
  }

  private parseUpbitAnnouncements(html: string): UpbitAnnouncement[] {
    try {
      const announcements: UpbitAnnouncement[] = [];
      
      const noticePattern = /<tr[^>]*>[\s\S]*?<td[^>]*class="[^"]*title[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>[\s\S]*?<td[^>]*class="[^"]*date[^"]*"[^>]*>(.*?)<\/td>[\s\S]*?<\/tr>/gi;
      let match;
      let id = Date.now();

      while ((match = noticePattern.exec(html)) !== null) {
        const url = match[1];
        const title = match[2].replace(/<[^>]*>/g, '').trim();
        const dateStr = match[3].trim();
        
        if (title && url) {
          announcements.push({
            id: id++,
            title,
            category: "거래",
            created_at: new Date(dateStr).toISOString(),
            url: url.startsWith('http') ? url : `https://upbit.com${url}`
          });
        }
        
        if (announcements.length >= 10) break;
      }

      if (announcements.length === 0) {
        console.log("No announcements parsed from HTML, using fallback");
        return this.getFallbackAnnouncements();
      }

      return announcements;
    } catch (error) {
      console.error("Error parsing announcements:", error);
      return this.getFallbackAnnouncements();
    }
  }

  private async processUpbitAnnouncement(announcement: UpbitAnnouncement): Promise<void> {
    const announcementKey = `upbit-${announcement.id}`;
    
    // 이미 처리된 공지인지 확인
    if (this.knownAnnouncements.has(announcementKey)) {
      return;
    }

    console.log(`Processing announcement: ${announcement.title}`);

    // 상장 관련 공지인지 확인
    if (this.isListingAnnouncement(announcement.title)) {
      console.log(`🚀 LISTING DETECTED: ${announcement.title}`);
      
      const coinInfo = this.extractCoinFromAnnouncement(announcement.title);
      
      if (coinInfo) {
        console.log(`Extracted coin: ${coinInfo.symbol}${coinInfo.name ? ` (${coinInfo.name})` : ''}`);
        
        // 데이터베이스에 저장
        const listing: InsertListing = {
          symbol: coinInfo.symbol,
          name: coinInfo.name || coinInfo.symbol,
          exchange: 'upbit',
          listedAt: new Date(announcement.created_at),
          marketId: `KRW-${coinInfo.symbol}`,
          announcementId: announcementKey,
          announcementTitle: announcement.title,
          announcementUrl: announcement.url,
          isAnnouncement: true,
        };

        try {
          const savedListing = await storage.createListing(listing);
          console.log(`✅ Saved listing: ${savedListing.symbol}`);
          
          // 알림 발송
          await notificationService.sendImmediateNotification(savedListing);
          console.log(`📨 Notification sent for ${savedListing.symbol}`);
          
          // 처리 완료된 공지로 등록
          this.knownAnnouncements.add(announcementKey);
        } catch (error) {
          console.error(`Failed to save listing for ${coinInfo.symbol}:`, error);
        }
      } else {
        console.log(`Could not extract coin info from: ${announcement.title}`);
      }
    } else {
      console.log(`Not a listing announcement: ${announcement.title}`);
    }
  }

  async checkBithumbAnnouncements(): Promise<void> {
    try {
      console.log("Monitoring Bithumb announcements...");
      
      const announcements = await this.fetchBithumbAnnouncements();
      console.log(`Found ${announcements.length} Bithumb announcements`);

      for (const announcement of announcements) {
        await this.processBithumbAnnouncement(announcement);
      }
    } catch (error) {
      console.error("Error checking Bithumb announcements:", error);
    }
  }

  private async fetchBithumbAnnouncements(): Promise<BithumbAnnouncement[]> {
    try {
      console.log("Fetching real Bithumb announcements...");
      
      const response = await fetch(this.bithumbAnnouncementUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
        }
      });

      if (!response.ok) {
        console.warn("Failed to fetch Bithumb announcements");
        return [];
      }

      const data = await response.json();
      return this.parseBithumbResponse(data);
      
    } catch (error) {
      console.warn("Error fetching Bithumb announcements:", error);
      return [];
    }
  }

  private parseBithumbResponse(data: any): BithumbAnnouncement[] {
    try {
      if (!data || !data.data || !Array.isArray(data.data)) {
        return [];
      }

      return data.data.slice(0, 10).map((item: any, index: number) => ({
        seq: item.seq || Date.now() + index,
        title: item.title || '',
        type: item.type || '일반',
        regDttm: item.regDttm || new Date().toISOString(),
        url: `https://cafe.bithumb.com/view/board-contents/${item.seq || ''}`
      }));
    } catch (error) {
      console.error("Error parsing Bithumb response:", error);
      return [];
    }
  }

  private async processBithumbAnnouncement(announcement: BithumbAnnouncement): Promise<void> {
    const announcementKey = `bithumb-${announcement.seq}`;
    
    if (this.knownAnnouncements.has(announcementKey)) {
      return;
    }

    console.log(`Processing Bithumb announcement: ${announcement.title}`);

    if (this.isListingAnnouncement(announcement.title)) {
      console.log(`🚀 BITHUMB LISTING DETECTED: ${announcement.title}`);
      
      const coinInfo = this.extractCoinFromAnnouncement(announcement.title);
      
      if (coinInfo) {
        console.log(`Extracted coin: ${coinInfo.symbol}${coinInfo.name ? ` (${coinInfo.name})` : ''}`);
        
        const listing: InsertListing = {
          symbol: coinInfo.symbol,
          name: coinInfo.name || coinInfo.symbol,
          exchange: 'bithumb',
          listedAt: new Date(announcement.regDttm),
          marketId: `KRW-${coinInfo.symbol}`,
          announcementId: announcementKey,
          announcementTitle: announcement.title,
          announcementUrl: announcement.url,
          isAnnouncement: true,
        };

        try {
          const savedListing = await storage.createListing(listing);
          console.log(`✅ Saved Bithumb listing: ${savedListing.symbol}`);
          
          await notificationService.sendImmediateNotification(savedListing);
          console.log(`📨 Notification sent for ${savedListing.symbol}`);
          
          this.knownAnnouncements.add(announcementKey);
        } catch (error) {
          console.error(`Failed to save Bithumb listing for ${coinInfo.symbol}:`, error);
        }
      } else {
        console.log(`Could not extract coin info from: ${announcement.title}`);
      }
    } else {
      console.log(`Not a listing announcement: ${announcement.title}`);
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

  async checkNewMarkets(): Promise<void> {
    try {
      console.log("Checking for new markets via API...");
      
      // 신규 마켓 감지를 위해 현재 시간 기준으로 최근 1시간 이내에 추가된 것만 체크
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const newMarkets = await upbitApi.getNewListings(this.knownMarkets);
      
      // 기존 마켓이 너무 많이 감지되면 최신 추가 상장만 처리 (최대 5개)
      const recentMarkets = newMarkets.slice(0, 5);
      
      if (newMarkets.length > 5) {
        console.log(`⚠️ Too many new markets detected (${newMarkets.length}). Processing only the first 5 recent ones.`);
      }
      
      for (const market of recentMarkets) {
        console.log(`🆕 New market detected: ${market.market}`);
        
        const symbol = market.market.replace(/^(KRW|BTC|USDT|ETH)-/, '');
        const listing: InsertListing = {
          symbol,
          name: market.korean_name || market.english_name,
          exchange: 'upbit',
          listedAt: new Date(),
          marketId: market.market,
          announcementId: `api-${market.market}-${Date.now()}`,
          announcementTitle: `${market.korean_name || market.english_name} (${symbol}) 마켓 디지털 자산 추가`,
          announcementUrl: `https://upbit.com/exchange?code=CRIX.UPBIT.${market.market}`,
          isAnnouncement: false,
        };

        try {
          const savedListing = await storage.createListing(listing);
          console.log(`✅ Saved new market listing: ${savedListing.symbol}`);
          
          await notificationService.sendImmediateNotification(savedListing);
          console.log(`📨 Notification sent for new market ${savedListing.symbol}`);
          
          this.knownMarkets.add(market.market);
          this.knownAnnouncements.add(listing.announcementId!);
        } catch (error) {
          console.error(`Failed to save new market listing for ${symbol}:`, error);
        }
      }
      
      if (recentMarkets.length === 0) {
        console.log("No new markets detected");
      }
    } catch (error) {
      console.error("Error checking new markets:", error);
    }
  }

  async monitorAll(): Promise<void> {
    console.log("Running announcement monitoring...");
    await Promise.all([
      this.checkUpbitAnnouncements(),
      this.checkBithumbAnnouncements()
      // checkNewMarkets 일시적으로 비활성화 - 초기 설정 시 기존 마켓을 신규로 인식하는 문제
      // this.checkNewMarkets()
    ]);
  }
}

export const announcementMonitor = new AnnouncementMonitor();