import { type Listing, type InsertListing, type NotificationSettings, type InsertNotificationSettings, type SystemStatus, type InsertSystemStatus } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Listings
  getListings(): Promise<Listing[]>;
  getListingsByExchange(exchange: string): Promise<Listing[]>;
  getRecentListings(limit?: number): Promise<Listing[]>;
  createListing(listing: InsertListing): Promise<Listing>;
  updateListing(id: string, listing: Partial<Listing>): Promise<Listing | undefined>;
  getListingByMarketId(marketId: string, exchange: string): Promise<Listing | undefined>;
  
  // Notification Settings
  getNotificationSettings(): Promise<NotificationSettings | undefined>;
  createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings>;
  updateNotificationSettings(id: string, settings: Partial<NotificationSettings>): Promise<NotificationSettings | undefined>;
  
  // System Status
  getSystemStatus(): Promise<SystemStatus[]>;
  getSystemStatusByService(service: string): Promise<SystemStatus | undefined>;
  updateSystemStatus(service: string, status: InsertSystemStatus): Promise<SystemStatus>;
}

export class MemStorage implements IStorage {
  private listings: Map<string, Listing>;
  private notificationSettings: Map<string, NotificationSettings>;
  private systemStatus: Map<string, SystemStatus>;

  constructor() {
    this.listings = new Map();
    this.notificationSettings = new Map();
    this.systemStatus = new Map();
    
    // Initialize default notification settings
    this.initializeDefaultSettings();
  }

  private async initializeDefaultSettings() {
    const defaultSettings: NotificationSettings = {
      id: randomUUID(),
      email: true,
      telegram: false,
      discord: false,
      pollingInterval: 60, // Faster polling for real-time alerts
      filterMajorCoinsOnly: false,
      filterMinMarketCap: null,
      emailAddress: null,
      telegramChatId: null,
      discordWebhookUrl: null,
      // Enhanced notification settings
      instantNotifications: true,
      soundAlerts: true,
      pushNotifications: true,
      notifyOnCrossExchangeAvailability: true,
      notifyOnDepositWithdrawStatus: true,
      minimumTimeBeforeListing: 300, // 5 minutes
      highPriorityOnly: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.notificationSettings.set(defaultSettings.id, defaultSettings);
  }

  async getListings(): Promise<Listing[]> {
    return Array.from(this.listings.values()).sort((a, b) => 
      new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime()
    );
  }

  async getListingsByExchange(exchange: string): Promise<Listing[]> {
    return Array.from(this.listings.values())
      .filter(listing => listing.exchange === exchange)
      .sort((a, b) => new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime());
  }

  async getRecentListings(limit: number = 10): Promise<Listing[]> {
    const allListings = await this.getListings();
    return allListings.slice(0, limit);
  }

  async createListing(insertListing: InsertListing): Promise<Listing> {
    const id = randomUUID();
    const listing: Listing = {
      ...insertListing,
      id,
      initialPrice: insertListing.initialPrice || null,
      currentPrice: insertListing.currentPrice || null,
      priceChangePercent: insertListing.priceChangePercent || null,
      notificationSent: insertListing.notificationSent || false,
      // Cross-exchange availability - default to false until checked
      binanceAvailable: false,
      bybitAvailable: false,
      okxAvailable: false,
      gateAvailable: false,
      huobiAvailable: false,
      kucoinAvailable: false,
      // Deposit/Withdrawal status - default to null until checked
      upbitDepositEnabled: null,
      upbitWithdrawEnabled: null,
      bithumbDepositEnabled: null,
      bithumbWithdrawEnabled: null,
      // Alert priority and timing
      priority: insertListing.priority || "normal",
      estimatedListingTime: insertListing.estimatedListingTime || null,
      // Announcement-specific fields
      announcementId: insertListing.announcementId || null,
      announcementTitle: insertListing.announcementTitle || null,
      announcementUrl: insertListing.announcementUrl || null,
      isAnnouncement: insertListing.isAnnouncement || false,
      createdAt: new Date(),
    };
    this.listings.set(id, listing);
    return listing;
  }

  async updateListing(id: string, updates: Partial<Listing>): Promise<Listing | undefined> {
    const existing = this.listings.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.listings.set(id, updated);
    return updated;
  }

  async getListingByMarketId(marketId: string, exchange: string): Promise<Listing | undefined> {
    return Array.from(this.listings.values()).find(
      listing => listing.marketId === marketId && listing.exchange === exchange
    );
  }

  async getNotificationSettings(): Promise<NotificationSettings | undefined> {
    const settings = Array.from(this.notificationSettings.values());
    return settings[0]; // Return first (and only) settings
  }

  async createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings> {
    const id = randomUUID();
    const notificationSetting: NotificationSettings = {
      ...settings,
      id,
      email: settings.email || false,
      telegram: settings.telegram || false,
      discord: settings.discord || false,
      pollingInterval: settings.pollingInterval || 60,
      filterMajorCoinsOnly: settings.filterMajorCoinsOnly || false,
      filterMinMarketCap: settings.filterMinMarketCap || null,
      emailAddress: settings.emailAddress || null,
      telegramChatId: settings.telegramChatId || null,
      discordWebhookUrl: settings.discordWebhookUrl || null,
      // Enhanced notification settings
      instantNotifications: settings.instantNotifications !== undefined ? settings.instantNotifications : true,
      soundAlerts: settings.soundAlerts !== undefined ? settings.soundAlerts : true,
      pushNotifications: settings.pushNotifications !== undefined ? settings.pushNotifications : true,
      notifyOnCrossExchangeAvailability: settings.notifyOnCrossExchangeAvailability !== undefined ? settings.notifyOnCrossExchangeAvailability : true,
      notifyOnDepositWithdrawStatus: settings.notifyOnDepositWithdrawStatus !== undefined ? settings.notifyOnDepositWithdrawStatus : true,
      minimumTimeBeforeListing: settings.minimumTimeBeforeListing || 300,
      highPriorityOnly: settings.highPriorityOnly || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.notificationSettings.set(id, notificationSetting);
    return notificationSetting;
  }

  async updateNotificationSettings(id: string, updates: Partial<NotificationSettings>): Promise<NotificationSettings | undefined> {
    const existing = this.notificationSettings.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.notificationSettings.set(id, updated);
    return updated;
  }

  async getSystemStatus(): Promise<SystemStatus[]> {
    return Array.from(this.systemStatus.values());
  }

  async getSystemStatusByService(service: string): Promise<SystemStatus | undefined> {
    return Array.from(this.systemStatus.values()).find(status => status.service === service);
  }

  async updateSystemStatus(service: string, statusData: InsertSystemStatus): Promise<SystemStatus> {
    const existing = await this.getSystemStatusByService(service);
    const id = existing?.id || randomUUID();
    
    const status: SystemStatus = {
      ...statusData,
      id,
      service,
      responseTime: statusData.responseTime || null,
      errorMessage: statusData.errorMessage || null,
      rateLimit: statusData.rateLimit || null,
      rateLimitUsed: statusData.rateLimitUsed || null,
    };
    
    this.systemStatus.set(service, status);
    return status;
  }
}

export const storage = new MemStorage();
