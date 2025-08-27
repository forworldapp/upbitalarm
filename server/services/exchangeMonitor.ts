import { storage } from "../storage";
import { type InsertListing, type InsertSystemStatus } from "@shared/schema";
import { crossExchangeMonitor } from "./crossExchangeMonitor";
import { notificationService } from "./notificationService";

interface UpbitMarket {
  market: string;
  english_name: string;
  market_warning?: string;
}

interface BithumbTicker {
  opening_price: string;
  closing_price: string;
  min_price: string;
  max_price: string;
  units_traded: string;
  acc_trade_value: string;
  prev_closing_price: string;
  units_traded_24H: string;
  acc_trade_value_24H: string;
  fluctate_24H: string;
  fluctate_rate_24H: string;
  date: string;
}

export class ExchangeMonitor {
  private upbitApiUrl = "https://api.upbit.com/v1";
  private bithumbApiUrl = "https://api.bithumb.com/public";
  private knownMarkets: Set<string> = new Set();

  constructor() {
    this.initializeKnownMarkets();
  }

  private async initializeKnownMarkets() {
    try {
      const existingListings = await storage.getListings();
      existingListings.forEach(listing => {
        this.knownMarkets.add(`${listing.exchange}:${listing.marketId}`);
      });
    } catch (error) {
      console.error("Failed to initialize known markets:", error);
    }
  }

  async checkUpbitListings(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.upbitApiUrl}/market/all?isDetails=true`);
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`Upbit API error: ${response.status} ${response.statusText}`);
      }

      const markets: UpbitMarket[] = await response.json();
      
      // Update system status
      await storage.updateSystemStatus("upbit", {
        service: "upbit",
        status: "healthy",
        lastCheck: new Date(),
        responseTime,
        errorMessage: null,
        rateLimit: 100, // Upbit's typical rate limit
        rateLimitUsed: parseInt(response.headers.get("x-ratelimit-used") || "0"),
      });

      // Check for new listings
      for (const market of markets) {
        const marketKey = `upbit:${market.market}`;
        
        if (!this.knownMarkets.has(marketKey)) {
          // New listing detected
          const listing: InsertListing = {
            symbol: market.market.split("-")[1],
            name: market.english_name,
            exchange: "upbit",
            listedAt: new Date(),
            marketId: market.market,
            initialPrice: null,
            currentPrice: null,
            priceChangePercent: null,
            notificationSent: false,
            priority: "high", // All new listings are high priority
          };

          const createdListing = await storage.createListing(listing);
          this.knownMarkets.add(marketKey);
          
          console.log(`🚨 NEW UPBIT LISTING DETECTED: ${market.english_name} (${market.market})`);
          
          // Immediately send notification for new listing
          await notificationService.sendImmediateNotification(createdListing);
          
          // Check cross-exchange availability in background
          crossExchangeMonitor.updateListingWithCrossExchangeData(createdListing)
            .catch(err => console.error("Failed to update cross-exchange data:", err));
        }
      }
    } catch (error) {
      console.error("Error checking Upbit listings:", error);
      
      await storage.updateSystemStatus("upbit", {
        service: "upbit",
        status: "error",
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        rateLimit: 100,
        rateLimitUsed: 0,
      });
    }
  }

  async checkBithumbListings(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.bithumbApiUrl}/ticker/all_krw`);
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`Bithumb API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status !== "0000") {
        throw new Error(`Bithumb API error: ${data.message}`);
      }

      // Update system status
      await storage.updateSystemStatus("bithumb", {
        service: "bithumb",
        status: "healthy",
        lastCheck: new Date(),
        responseTime,
        errorMessage: null,
        rateLimit: 60, // Bithumb's typical rate limit
        rateLimitUsed: 0, // Bithumb doesn't provide this in headers
      });

      // Check for new listings
      const tickers = data.data;
      
      for (const [symbol, ticker] of Object.entries(tickers)) {
        if (symbol === "date") continue; // Skip date field
        
        const marketKey = `bithumb:${symbol}_KRW`;
        
        if (!this.knownMarkets.has(marketKey)) {
          // New listing detected
          const listing: InsertListing = {
            symbol: symbol,
            name: symbol, // Bithumb doesn't provide full names in ticker API
            exchange: "bithumb",
            listedAt: new Date(),
            marketId: `${symbol}_KRW`,
            initialPrice: (ticker as BithumbTicker).opening_price,
            currentPrice: (ticker as BithumbTicker).closing_price,
            priceChangePercent: (ticker as BithumbTicker).fluctate_rate_24H,
            notificationSent: false,
            priority: "high", // All new listings are high priority
          };

          const createdListing = await storage.createListing(listing);
          this.knownMarkets.add(marketKey);
          
          console.log(`🚨 NEW BITHUMB LISTING DETECTED: ${symbol}`);
          
          // Immediately send notification for new listing
          await notificationService.sendImmediateNotification(createdListing);
          
          // Check cross-exchange availability in background
          crossExchangeMonitor.updateListingWithCrossExchangeData(createdListing)
            .catch(err => console.error("Failed to update cross-exchange data:", err));
        }
      }
    } catch (error) {
      console.error("Error checking Bithumb listings:", error);
      
      await storage.updateSystemStatus("bithumb", {
        service: "bithumb",
        status: "error",
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        rateLimit: 60,
        rateLimitUsed: 0,
      });
    }
  }

  async checkAllExchanges(): Promise<void> {
    await Promise.all([
      this.checkUpbitListings(),
      this.checkBithumbListings(),
    ]);
  }
}

export const exchangeMonitor = new ExchangeMonitor();
