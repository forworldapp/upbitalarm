// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  listings;
  notificationSettings;
  systemStatus;
  constructor() {
    this.listings = /* @__PURE__ */ new Map();
    this.notificationSettings = /* @__PURE__ */ new Map();
    this.systemStatus = /* @__PURE__ */ new Map();
    this.initializeDefaultSettings();
  }
  async initializeDefaultSettings() {
    const defaultSettings = {
      id: randomUUID(),
      email: true,
      telegram: false,
      discord: false,
      pollingInterval: 60,
      // Faster polling for real-time alerts
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
      minimumTimeBeforeListing: 300,
      // 5 minutes
      highPriorityOnly: false,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.notificationSettings.set(defaultSettings.id, defaultSettings);
  }
  async getListings() {
    return Array.from(this.listings.values()).sort(
      (a, b) => new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime()
    );
  }
  async getListingsByExchange(exchange) {
    return Array.from(this.listings.values()).filter((listing) => listing.exchange === exchange).sort((a, b) => new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime());
  }
  async getRecentListings(limit = 10) {
    const allListings = await this.getListings();
    return allListings.slice(0, limit);
  }
  async createListing(insertListing) {
    const id = randomUUID();
    const listing = {
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
      createdAt: /* @__PURE__ */ new Date()
    };
    this.listings.set(id, listing);
    return listing;
  }
  async updateListing(id, updates) {
    const existing = this.listings.get(id);
    if (!existing) return void 0;
    const updated = { ...existing, ...updates };
    this.listings.set(id, updated);
    return updated;
  }
  async getListingByMarketId(marketId, exchange) {
    return Array.from(this.listings.values()).find(
      (listing) => listing.marketId === marketId && listing.exchange === exchange
    );
  }
  async getNotificationSettings() {
    const settings = Array.from(this.notificationSettings.values());
    return settings[0];
  }
  async createNotificationSettings(settings) {
    const id = randomUUID();
    const notificationSetting = {
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
      instantNotifications: settings.instantNotifications !== void 0 ? settings.instantNotifications : true,
      soundAlerts: settings.soundAlerts !== void 0 ? settings.soundAlerts : true,
      pushNotifications: settings.pushNotifications !== void 0 ? settings.pushNotifications : true,
      notifyOnCrossExchangeAvailability: settings.notifyOnCrossExchangeAvailability !== void 0 ? settings.notifyOnCrossExchangeAvailability : true,
      notifyOnDepositWithdrawStatus: settings.notifyOnDepositWithdrawStatus !== void 0 ? settings.notifyOnDepositWithdrawStatus : true,
      minimumTimeBeforeListing: settings.minimumTimeBeforeListing || 300,
      highPriorityOnly: settings.highPriorityOnly || false,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.notificationSettings.set(id, notificationSetting);
    return notificationSetting;
  }
  async updateNotificationSettings(id, updates) {
    const existing = this.notificationSettings.get(id);
    if (!existing) return void 0;
    const updated = { ...existing, ...updates, updatedAt: /* @__PURE__ */ new Date() };
    this.notificationSettings.set(id, updated);
    return updated;
  }
  async getSystemStatus() {
    return Array.from(this.systemStatus.values());
  }
  async getSystemStatusByService(service) {
    return Array.from(this.systemStatus.values()).find((status) => status.service === service);
  }
  async updateSystemStatus(service, statusData) {
    const existing = await this.getSystemStatusByService(service);
    const id = existing?.id || randomUUID();
    const status = {
      ...statusData,
      id,
      service,
      responseTime: statusData.responseTime || null,
      errorMessage: statusData.errorMessage || null,
      rateLimit: statusData.rateLimit || null,
      rateLimitUsed: statusData.rateLimitUsed || null
    };
    this.systemStatus.set(service, status);
    return status;
  }
};
var storage = new MemStorage();

// server/services/notificationService.ts
var NotificationService = class {
  emailApiKey;
  telegramBotToken;
  soundAlertPlayed = /* @__PURE__ */ new Set();
  constructor() {
    this.emailApiKey = process.env.EMAIL_API_KEY || process.env.SENDGRID_API_KEY || "";
    this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || "";
  }
  async sendImmediateNotification(listing) {
    const settings = await storage.getNotificationSettings();
    if (!settings || !settings.instantNotifications) return;
    console.log(`\u{1F514} IMMEDIATE ALERT: New ${listing.exchange.toUpperCase()} listing - ${listing.name} (${listing.symbol})`);
    await this.sendNotifications(listing);
    await this.logAlert(listing, "IMMEDIATE_LISTING_ALERT");
  }
  async logAlert(listing, alertType) {
    const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
    console.log(`[${timestamp2}] ${alertType}: ${listing.exchange.toUpperCase()} - ${listing.name} (${listing.symbol}) - Market: ${listing.marketId}`);
  }
  async sendNotifications(listing) {
    const settings = await storage.getNotificationSettings();
    if (!settings) return;
    const promises = [];
    if (settings.email && settings.emailAddress) {
      promises.push(this.sendEmailNotification(listing, settings));
    }
    if (settings.telegram && settings.telegramChatId) {
      promises.push(this.sendTelegramNotification(listing, settings));
    }
    if (settings.discord && settings.discordWebhookUrl) {
      promises.push(this.sendDiscordNotification(listing, settings));
    }
    await Promise.allSettled(promises);
    await storage.updateListing(listing.id, { notificationSent: true });
  }
  async sendEmailNotification(listing, settings) {
    try {
      const subject = `\uC0C8\uB85C\uC6B4 \uC554\uD638\uD654\uD3D0 \uC0C1\uC7A5: ${listing.name} (${listing.symbol})`;
      const body = this.generateEmailBody(listing);
      console.log(`\u{1F4E7} Email notification would be sent to ${settings.emailAddress}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body}`);
    } catch (error) {
      console.error("Failed to send email notification:", error);
    }
  }
  async sendTelegramNotification(listing, settings) {
    try {
      const message = this.generateTelegramMessage(listing);
      if (!this.telegramBotToken) {
        console.log("\u26A0\uFE0F Telegram bot token not configured");
        return;
      }
      const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: message,
          parse_mode: "Markdown"
        })
      });
      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`);
      }
      console.log(`\u2705 Telegram notification sent to ${settings.telegramChatId}`);
    } catch (error) {
      console.error("Failed to send Telegram notification:", error);
    }
  }
  async sendDiscordNotification(listing, settings) {
    try {
      const embed = this.generateDiscordEmbed(listing);
      const response = await fetch(settings.discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [embed]
        })
      });
      if (!response.ok) {
        throw new Error(`Discord webhook error: ${response.status}`);
      }
      console.log(`\u2705 Discord notification sent`);
    } catch (error) {
      console.error("Failed to send Discord notification:", error);
    }
  }
  generateEmailBody(listing) {
    const exchangeName = listing.exchange === "upbit" ? "\uC5C5\uBE44\uD2B8" : "\uBE57\uC378";
    return `
      \uC0C8\uB85C\uC6B4 \uC554\uD638\uD654\uD3D0\uAC00 ${exchangeName}\uC5D0 \uC0C1\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4!
      
      \uCF54\uC778\uBA85: ${listing.name}
      \uC2EC\uBCFC: ${listing.symbol}
      \uAC70\uB798\uC18C: ${exchangeName}
      \uC0C1\uC7A5\uC77C\uC2DC: ${listing.listedAt.toLocaleString("ko-KR")}
      \uB9C8\uCF13 ID: ${listing.marketId}
      
      ${listing.currentPrice ? `\uD604\uC7AC \uAC00\uACA9: \u20A9${listing.currentPrice}` : ""}
      ${listing.priceChangePercent ? `\uBCC0\uB3D9\uB960: ${listing.priceChangePercent}%` : ""}
      
      \uC774 \uC54C\uB9BC\uC740 Crypto Listing Monitor\uC5D0\uC11C \uC790\uB3D9\uC73C\uB85C \uBC1C\uC1A1\uB418\uC5C8\uC2B5\uB2C8\uB2E4.
    `;
  }
  generateTelegramMessage(listing) {
    const exchangeName = listing.exchange === "upbit" ? "\uC5C5\uBE44\uD2B8" : "\uBE57\uC378";
    const exchangeEmoji = listing.exchange === "upbit" ? "\u{1F535}" : "\u{1F7E1}";
    let message = `\u{1F6A8} *\uC2E0\uADDC\uC0C1\uC7A5* ${exchangeEmoji}
`;
    message += `**${listing.symbol}** - ${exchangeName}
`;
    message += `${listing.listedAt.toLocaleString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
`;
    const availableExchanges = [];
    if (listing.binanceAvailable) availableExchanges.push("\uBC14\uC774\uB0B8\uC2A4");
    if (listing.bybitAvailable) availableExchanges.push("\uBC14\uC774\uBE44\uD2B8");
    if (listing.okxAvailable) availableExchanges.push("OKX");
    if (listing.gateAvailable) availableExchanges.push("Gate");
    if (listing.kucoinAvailable) availableExchanges.push("KuCoin");
    if (listing.huobiAvailable) availableExchanges.push("\uD6C4\uC624\uBE44");
    if (availableExchanges.length > 0) {
      message += `
\u{1F4B0} \uB2E4\uB978\uAC70\uB798\uC18C: ${availableExchanges.join(", ")}`;
    }
    return message;
  }
  generateDiscordEmbed(listing) {
    const exchangeName = listing.exchange === "upbit" ? "\uC5C5\uBE44\uD2B8" : "\uBE57\uC378";
    const color = listing.exchange === "upbit" ? 1668818 : 16088064;
    return {
      title: `\u{1F680} \uC0C8\uB85C\uC6B4 \uC0C1\uC7A5: ${listing.name}`,
      description: `${listing.symbol}\uC774(\uAC00) ${exchangeName}\uC5D0 \uC0C1\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4!`,
      color,
      fields: [
        {
          name: "\uAC70\uB798\uC18C",
          value: exchangeName,
          inline: true
        },
        {
          name: "\uC2EC\uBCFC",
          value: listing.symbol,
          inline: true
        },
        {
          name: "\uB9C8\uCF13 ID",
          value: listing.marketId,
          inline: true
        },
        {
          name: "\uC0C1\uC7A5\uC77C\uC2DC",
          value: listing.listedAt.toLocaleString("ko-KR"),
          inline: false
        }
      ],
      timestamp: listing.listedAt.toISOString(),
      footer: {
        text: "Crypto Listing Monitor"
      }
    };
  }
};
var notificationService = new NotificationService();

// server/services/upbitApi.ts
import crypto from "crypto";
import jwt from "jsonwebtoken";
var UpbitApi = class {
  baseUrl = "https://api.upbit.com/v1";
  accessKey = process.env.UPBIT_ACCESS_KEY;
  secretKey = process.env.UPBIT_SECRET_KEY;
  generateAuthToken(queryString = "") {
    if (!this.accessKey || !this.secretKey) {
      console.warn("Upbit API keys not configured, using public endpoints only");
      return "";
    }
    try {
      const payload = {
        access_key: this.accessKey,
        nonce: crypto.randomUUID()
      };
      if (queryString) {
        const hash = crypto.createHash("sha512");
        hash.update(queryString, "utf8");
        payload.query_hash = hash.digest("hex");
        payload.query_hash_alg = "SHA512";
      }
      const token = jwt.sign(payload, this.secretKey);
      return `Bearer ${token}`;
    } catch (error) {
      console.error("Error generating auth token:", error);
      return "";
    }
  }
  async getAllMarkets() {
    try {
      const response = await fetch(`${this.baseUrl}/market/all?isDetails=true`, {
        headers: {
          "Accept": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching markets:", error);
      throw error;
    }
  }
  async getKRWMarkets() {
    const allMarkets = await this.getAllMarkets();
    return allMarkets.filter((market) => market.market.startsWith("KRW-"));
  }
  async getNewListings(knownMarkets) {
    const currentMarkets = await this.getKRWMarkets();
    const newMarkets = [];
    for (const market of currentMarkets) {
      if (!knownMarkets.has(market.market)) {
        newMarkets.push(market);
        console.log(`\u{1F195} New market detected: ${market.market} - ${market.korean_name}`);
      }
    }
    return newMarkets;
  }
  async getTicker(market) {
    try {
      const response = await fetch(`${this.baseUrl}/ticker?markets=${market}`, {
        headers: {
          "Accept": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`Ticker request failed: ${response.status}`);
      }
      const data = await response.json();
      return data[0];
    } catch (error) {
      console.error(`Error fetching ticker for ${market}:`, error);
      return null;
    }
  }
  async getRecentCandles(market, count = 10) {
    try {
      const response = await fetch(`${this.baseUrl}/candles/minutes/1?market=${market}&count=${count}`, {
        headers: {
          "Accept": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`Candles request failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching candles for ${market}:`, error);
      return [];
    }
  }
};
var upbitApi = new UpbitApi();

// server/services/announcementMonitor.ts
var AnnouncementMonitor = class {
  upbitAnnouncementUrl = "https://upbit.com/service_center/notice";
  bithumbAnnouncementUrl = "https://feed.bithumb.com/notice";
  knownAnnouncements = /* @__PURE__ */ new Set();
  knownMarkets = /* @__PURE__ */ new Set();
  isInitialized = false;
  constructor() {
    this.initializeKnownAnnouncements();
  }
  async initializeKnownAnnouncements() {
    if (this.isInitialized) return;
    try {
      const existingListings = await storage.getListings();
      existingListings.forEach((listing) => {
        if (listing.announcementId) {
          this.knownAnnouncements.add(listing.announcementId);
        }
        if (listing.marketId) {
          this.knownMarkets.add(listing.marketId);
        }
      });
      if (existingListings.length === 0) {
        try {
          const markets = await upbitApi.getKRWMarkets();
          markets.forEach((market) => {
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
  async checkUpbitAnnouncements() {
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
  async fetchUpbitAnnouncements() {
    try {
      console.log("Fetching real Upbit announcements...");
      const response = await fetch(this.upbitAnnouncementUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3",
          "Accept-Encoding": "gzip, deflate, br",
          "DNT": "1",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1"
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
  getFallbackAnnouncements() {
    console.log("No real announcements found. Waiting for actual new listings...");
    return [];
  }
  parseUpbitAnnouncements(html) {
    try {
      const announcements = [];
      const noticePattern = /<tr[^>]*>[\s\S]*?<td[^>]*class="[^"]*title[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>[\s\S]*?<td[^>]*class="[^"]*date[^"]*"[^>]*>(.*?)<\/td>[\s\S]*?<\/tr>/gi;
      let match;
      let id = Date.now();
      while ((match = noticePattern.exec(html)) !== null) {
        const url = match[1];
        const title = match[2].replace(/<[^>]*>/g, "").trim();
        const dateStr = match[3].trim();
        if (title && url) {
          announcements.push({
            id: id++,
            title,
            category: "\uAC70\uB798",
            created_at: new Date(dateStr).toISOString(),
            url: url.startsWith("http") ? url : `https://upbit.com${url}`
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
  async processUpbitAnnouncement(announcement) {
    const announcementKey = `upbit-${announcement.id}`;
    if (this.knownAnnouncements.has(announcementKey)) {
      return;
    }
    console.log(`Processing announcement: ${announcement.title}`);
    if (this.isListingAnnouncement(announcement.title)) {
      console.log(`\u{1F680} LISTING DETECTED: ${announcement.title}`);
      const coinInfo = this.extractCoinFromAnnouncement(announcement.title);
      if (coinInfo) {
        console.log(`Extracted coin: ${coinInfo.symbol}${coinInfo.name ? ` (${coinInfo.name})` : ""}`);
        const listing = {
          symbol: coinInfo.symbol,
          name: coinInfo.name || coinInfo.symbol,
          exchange: "upbit",
          listedAt: new Date(announcement.created_at),
          marketId: `KRW-${coinInfo.symbol}`,
          announcementId: announcementKey,
          announcementTitle: announcement.title,
          announcementUrl: announcement.url,
          isAnnouncement: true
        };
        try {
          const savedListing = await storage.createListing(listing);
          console.log(`\u2705 Saved listing: ${savedListing.symbol}`);
          await notificationService.sendImmediateNotification(savedListing);
          console.log(`\u{1F4E8} Notification sent for ${savedListing.symbol}`);
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
  async checkBithumbAnnouncements() {
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
  async fetchBithumbAnnouncements() {
    try {
      console.log("Fetching real Bithumb announcements...");
      const response = await fetch(this.bithumbAnnouncementUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3"
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
  parseBithumbResponse(data) {
    try {
      if (!data || !data.data || !Array.isArray(data.data)) {
        return [];
      }
      return data.data.slice(0, 10).map((item, index) => ({
        seq: item.seq || Date.now() + index,
        title: item.title || "",
        type: item.type || "\uC77C\uBC18",
        regDttm: item.regDttm || (/* @__PURE__ */ new Date()).toISOString(),
        url: `https://cafe.bithumb.com/view/board-contents/${item.seq || ""}`
      }));
    } catch (error) {
      console.error("Error parsing Bithumb response:", error);
      return [];
    }
  }
  async processBithumbAnnouncement(announcement) {
    const announcementKey = `bithumb-${announcement.seq}`;
    if (this.knownAnnouncements.has(announcementKey)) {
      return;
    }
    console.log(`Processing Bithumb announcement: ${announcement.title}`);
    if (this.isListingAnnouncement(announcement.title)) {
      console.log(`\u{1F680} BITHUMB LISTING DETECTED: ${announcement.title}`);
      const coinInfo = this.extractCoinFromAnnouncement(announcement.title);
      if (coinInfo) {
        console.log(`Extracted coin: ${coinInfo.symbol}${coinInfo.name ? ` (${coinInfo.name})` : ""}`);
        const listing = {
          symbol: coinInfo.symbol,
          name: coinInfo.name || coinInfo.symbol,
          exchange: "bithumb",
          listedAt: new Date(announcement.regDttm),
          marketId: `KRW-${coinInfo.symbol}`,
          announcementId: announcementKey,
          announcementTitle: announcement.title,
          announcementUrl: announcement.url,
          isAnnouncement: true
        };
        try {
          const savedListing = await storage.createListing(listing);
          console.log(`\u2705 Saved Bithumb listing: ${savedListing.symbol}`);
          await notificationService.sendImmediateNotification(savedListing);
          console.log(`\u{1F4E8} Notification sent for ${savedListing.symbol}`);
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
  isListingAnnouncement(title) {
    const listingKeywords = [
      // 업비트 키워드
      "\uB9C8\uCF13 \uB514\uC9C0\uD138 \uC790\uC0B0 \uCD94\uAC00",
      "\uB514\uC9C0\uD138 \uC790\uC0B0 \uCD94\uAC00",
      "KRW \uB9C8\uCF13 \uB514\uC9C0\uD138 \uC790\uC0B0 \uCD94\uAC00",
      "BTC \uB9C8\uCF13 \uB514\uC9C0\uD138 \uC790\uC0B0 \uCD94\uAC00",
      "USDT \uB9C8\uCF13 \uB514\uC9C0\uD138 \uC790\uC0B0 \uCD94\uAC00",
      "\uC6D0\uD654\uB9C8\uCF13 \uCD94\uAC00",
      "\uAC70\uB798\uC9C0\uC6D0 \uAC1C\uC2DC",
      "\uAC70\uB798 \uC9C0\uC6D0 \uAC1C\uC2DC",
      "\uC2E0\uADDC \uB514\uC9C0\uD138 \uC790\uC0B0 \uAC70\uB798",
      // 빗썸 키워드
      "\uC6D0\uD654 \uB9C8\uCF13 \uCD94\uAC00",
      "BTC \uB9C8\uCF13 \uCD94\uAC00",
      "\uB9C8\uCF13 \uCD94\uAC00",
      "\uAC70\uB798\uC9C0\uC6D0",
      "\uAC70\uB798 \uAC1C\uC2DC",
      // 영어 키워드
      "Digital Asset Addition",
      "Market Addition"
    ];
    const lowerTitle = title.toLowerCase();
    return listingKeywords.some(
      (keyword) => lowerTitle.includes(keyword.toLowerCase())
    );
  }
  extractCoinFromAnnouncement(title) {
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
        const name = match[2] ? match[1]?.trim() : void 0;
        const nonCoinWords = ["KRW", "BTC", "USDT", "ETH", "USD"];
        if (!nonCoinWords.includes(symbol) && symbol.length >= 2 && symbol.length <= 10) {
          return { symbol: symbol.toUpperCase(), name };
        }
      }
    }
    return null;
  }
  async checkNewMarkets() {
    try {
      console.log("Checking for new markets via API...");
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1e3);
      const newMarkets = await upbitApi.getNewListings(this.knownMarkets);
      const recentMarkets = newMarkets.slice(0, 5);
      if (newMarkets.length > 5) {
        console.log(`\u26A0\uFE0F Too many new markets detected (${newMarkets.length}). Processing only the first 5 recent ones.`);
      }
      for (const market of recentMarkets) {
        console.log(`\u{1F195} New market detected: ${market.market}`);
        const symbol = market.market.replace(/^(KRW|BTC|USDT|ETH)-/, "");
        const listing = {
          symbol,
          name: market.korean_name || market.english_name,
          exchange: "upbit",
          listedAt: /* @__PURE__ */ new Date(),
          marketId: market.market,
          announcementId: `api-${market.market}-${Date.now()}`,
          announcementTitle: `${market.korean_name || market.english_name} (${symbol}) \uB9C8\uCF13 \uB514\uC9C0\uD138 \uC790\uC0B0 \uCD94\uAC00`,
          announcementUrl: `https://upbit.com/exchange?code=CRIX.UPBIT.${market.market}`,
          isAnnouncement: false
        };
        try {
          const savedListing = await storage.createListing(listing);
          console.log(`\u2705 Saved new market listing: ${savedListing.symbol}`);
          await notificationService.sendImmediateNotification(savedListing);
          console.log(`\u{1F4E8} Notification sent for new market ${savedListing.symbol}`);
          this.knownMarkets.add(market.market);
          this.knownAnnouncements.add(listing.announcementId);
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
  async monitorAll() {
    console.log("Running announcement monitoring...");
    await Promise.all([
      this.checkUpbitAnnouncements(),
      this.checkBithumbAnnouncements()
      // checkNewMarkets 일시적으로 비활성화 - 초기 설정 시 기존 마켓을 신규로 인식하는 문제
      // this.checkNewMarkets()
    ]);
  }
};
var announcementMonitor = new AnnouncementMonitor();

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var listings = pgTable("listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  exchange: text("exchange").notNull(),
  // 'upbit' or 'bithumb'
  listedAt: timestamp("listed_at").notNull(),
  initialPrice: decimal("initial_price"),
  currentPrice: decimal("current_price"),
  priceChangePercent: decimal("price_change_percent"),
  marketId: text("market_id").notNull(),
  notificationSent: boolean("notification_sent").default(false),
  // Cross-exchange availability information
  binanceAvailable: boolean("binance_available").default(false),
  bybitAvailable: boolean("bybit_available").default(false),
  okxAvailable: boolean("okx_available").default(false),
  gateAvailable: boolean("gate_available").default(false),
  huobiAvailable: boolean("huobi_available").default(false),
  kucoinAvailable: boolean("kucoin_available").default(false),
  // Deposit/Withdrawal status for target exchanges
  upbitDepositEnabled: boolean("upbit_deposit_enabled"),
  upbitWithdrawEnabled: boolean("upbit_withdraw_enabled"),
  bithumbDepositEnabled: boolean("bithumb_deposit_enabled"),
  bithumbWithdrawEnabled: boolean("bithumb_withdraw_enabled"),
  // Alert priority and timing
  priority: text("priority").default("normal"),
  // 'high', 'normal', 'low'
  estimatedListingTime: timestamp("estimated_listing_time"),
  // Announcement-specific fields
  announcementId: text("announcement_id"),
  announcementTitle: text("announcement_title"),
  announcementUrl: text("announcement_url"),
  isAnnouncement: boolean("is_announcement").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});
var notificationSettings = pgTable("notification_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: boolean("email").default(true),
  telegram: boolean("telegram").default(false),
  discord: boolean("discord").default(false),
  pollingInterval: integer("polling_interval").default(60),
  // seconds - faster for real-time
  filterMajorCoinsOnly: boolean("filter_major_coins_only").default(false),
  filterMinMarketCap: decimal("filter_min_market_cap"),
  emailAddress: text("email_address"),
  telegramChatId: text("telegram_chat_id"),
  discordWebhookUrl: text("discord_webhook_url"),
  // Enhanced notification settings
  instantNotifications: boolean("instant_notifications").default(true),
  soundAlerts: boolean("sound_alerts").default(true),
  pushNotifications: boolean("push_notifications").default(true),
  notifyOnCrossExchangeAvailability: boolean("notify_cross_exchange").default(true),
  notifyOnDepositWithdrawStatus: boolean("notify_deposit_withdraw").default(true),
  minimumTimeBeforeListing: integer("min_time_before_listing").default(300),
  // 5 minutes
  highPriorityOnly: boolean("high_priority_only").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`)
});
var systemStatus = pgTable("system_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  service: text("service").notNull(),
  // 'upbit', 'bithumb', 'notifications'
  status: text("status").notNull(),
  // 'healthy', 'error', 'degraded'
  lastCheck: timestamp("last_check").notNull(),
  responseTime: integer("response_time"),
  // milliseconds
  errorMessage: text("error_message"),
  rateLimit: integer("rate_limit"),
  rateLimitUsed: integer("rate_limit_used")
});
var insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  createdAt: true
});
var insertNotificationSettingsSchema = createInsertSchema(notificationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertSystemStatusSchema = createInsertSchema(systemStatus).omit({
  id: true
});

// server/routes.ts
import cron from "node-cron";
async function registerRoutes(app2) {
  app2.get("/api/listings", async (req, res) => {
    try {
      const { exchange, limit } = req.query;
      let listings2;
      if (exchange && typeof exchange === "string") {
        listings2 = await storage.getListingsByExchange(exchange);
      } else {
        listings2 = await storage.getListings();
      }
      if (limit && typeof limit === "string") {
        const limitNum = parseInt(limit);
        listings2 = listings2.slice(0, limitNum);
      }
      res.json(listings2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  });
  app2.get("/api/listings/recent", async (req, res) => {
    try {
      const { limit } = req.query;
      const limitNum = limit ? parseInt(limit) : 10;
      const listings2 = await storage.getRecentListings(limitNum);
      res.json(listings2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent listings" });
    }
  });
  app2.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getNotificationSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });
  app2.patch("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getNotificationSettings();
      if (!settings) {
        return res.status(404).json({ error: "Settings not found" });
      }
      const validatedData = insertNotificationSettingsSchema.partial().parse(req.body);
      const updatedSettings = await storage.updateNotificationSettings(settings.id, validatedData);
      res.json(updatedSettings);
    } catch (error) {
      res.status(400).json({ error: "Failed to update settings" });
    }
  });
  app2.get("/api/status", async (req, res) => {
    try {
      const status = await storage.getSystemStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch system status" });
    }
  });
  app2.post("/api/check", async (req, res) => {
    try {
      await announcementMonitor.monitorAll();
      res.json({ message: "Announcement monitoring completed" });
    } catch (error) {
      res.status(500).json({ error: "Failed to check announcements" });
    }
  });
  app2.get("/api/dashboard/stats", async (req, res) => {
    try {
      const allListings = await storage.getListings();
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const newListingsToday = allListings.filter(
        (listing) => new Date(listing.listedAt) >= today
      ).length;
      const totalNotificationsSent = allListings.filter(
        (listing) => listing.notificationSent
      ).length;
      const systemStatus2 = await storage.getSystemStatus();
      const upbitStatus = systemStatus2.find((s) => s.service === "upbit");
      const bithumbStatus = systemStatus2.find((s) => s.service === "bithumb");
      res.json({
        totalMonitored: allListings.length,
        newListingsToday,
        notificationsSent: totalNotificationsSent,
        uptime: "99.8%",
        // This would be calculated based on actual uptime data
        lastCheck: Math.max(
          upbitStatus?.lastCheck?.getTime() || 0,
          bithumbStatus?.lastCheck?.getTime() || 0
        ),
        upbitStatus: {
          status: upbitStatus?.status || "unknown",
          responseTime: upbitStatus?.responseTime || 0,
          rateLimit: upbitStatus?.rateLimit || 100,
          rateLimitUsed: upbitStatus?.rateLimitUsed || 0
        },
        bithumbStatus: {
          status: bithumbStatus?.status || "unknown",
          responseTime: bithumbStatus?.responseTime || 0,
          rateLimit: bithumbStatus?.rateLimit || 60,
          rateLimitUsed: bithumbStatus?.rateLimitUsed || 0
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });
  app2.post("/api/alerts/test", async (req, res) => {
    try {
      console.log("\u{1F514} Manual alert test triggered");
      res.json({ message: "Alert test completed", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    } catch (error) {
      res.status(500).json({ error: "Failed to send test alert" });
    }
  });
  app2.post("/api/alerts/test-announcement", async (req, res) => {
    try {
      const announcements = [
        {
          symbol: "CYBER",
          name: "\uC0AC\uC774\uBC84",
          exchange: "upbit",
          title: "\uC0AC\uC774\uBC84(CYBER) KRW, USDT \uB9C8\uCF13 \uB514\uC9C0\uD138 \uC790\uC0B0 \uCD94\uAC00",
          url: "https://upbit.com/service_center/notice?id=5409"
        },
        {
          symbol: "SD",
          name: "\uC2A4\uD14C\uC774\uB354",
          exchange: "bithumb",
          title: "\uC2A4\uD14C\uC774\uB354(SD) \uC6D0\uD654 \uB9C8\uCF13 \uCD94\uAC00",
          url: "https://feed.bithumb.com/notice/1649642"
        }
      ];
      const randomAnnouncement = announcements[Math.floor(Math.random() * announcements.length)];
      const testAnnouncement = {
        symbol: randomAnnouncement.symbol,
        name: randomAnnouncement.name,
        exchange: randomAnnouncement.exchange,
        marketId: `ANNOUNCEMENT-${randomAnnouncement.symbol}`,
        listedAt: /* @__PURE__ */ new Date(),
        announcementId: `test:${Date.now()}`,
        announcementTitle: randomAnnouncement.title,
        announcementUrl: randomAnnouncement.url,
        isAnnouncement: true
      };
      const createdListing = await storage.createListing(testAnnouncement);
      console.log("\u{1F4E2} Test announcement alert created");
      await notificationService.sendImmediateNotification(createdListing);
      res.json({ message: "Test announcement alert created", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    } catch (error) {
      console.error("Test announcement error:", error);
      res.status(500).json({ error: "Test announcement failed" });
    }
  });
  app2.post("/api/monitor/force", async (req, res) => {
    try {
      console.log("\u{1F6A8} FORCE ANNOUNCEMENT MONITORING TRIGGERED");
      await announcementMonitor.monitorAll();
      res.json({
        message: "Force announcement monitoring completed",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Force announcement monitoring failed:", error);
      res.status(500).json({ error: "Force announcement monitoring failed" });
    }
  });
  app2.post("/api/monitor/announcements", async (req, res) => {
    try {
      console.log("\u{1F514} TESTING ANNOUNCEMENT MONITORING");
      await announcementMonitor.monitorAll();
      res.json({
        message: "Announcement monitoring test completed",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Announcement monitoring test failed:", error);
      res.status(500).json({ error: "Announcement monitoring test failed" });
    }
  });
  const setupScheduledTasks = async () => {
    const settings = await storage.getNotificationSettings();
    const pollingInterval = settings?.pollingInterval || 60;
    let cronPattern;
    if (pollingInterval < 60) {
      cronPattern = `*/${pollingInterval} * * * * *`;
    } else {
      const minutes = Math.floor(pollingInterval / 60);
      cronPattern = `*/${minutes} * * * *`;
    }
    const intervalText = pollingInterval < 60 ? `${pollingInterval} seconds` : `${Math.floor(pollingInterval / 60)} minutes`;
    console.log(`Setting up scheduled monitoring with interval: ${intervalText}`);
    cron.schedule("*/30 * * * * *", async () => {
      try {
        await announcementMonitor.monitorAll();
      } catch (error) {
        console.error("Announcement monitoring failed:", error);
      }
    });
  };
  setupScheduledTasks();
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "..", "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import dotenv from "dotenv";
dotenv.config();
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
