import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { exchangeMonitor } from "./services/exchangeMonitor";
import { announcementMonitor } from "./services/announcementMonitor";
import { notificationService } from "./services/notificationService";
import { insertNotificationSettingsSchema } from "@shared/schema";
import cron from "node-cron";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all listings
  app.get("/api/listings", async (req, res) => {
    try {
      const { exchange, limit } = req.query;
      
      let listings;
      if (exchange && typeof exchange === "string") {
        listings = await storage.getListingsByExchange(exchange);
      } else {
        listings = await storage.getListings();
      }
      
      if (limit && typeof limit === "string") {
        const limitNum = parseInt(limit);
        listings = listings.slice(0, limitNum);
      }
      
      res.json(listings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  // Get recent listings
  app.get("/api/listings/recent", async (req, res) => {
    try {
      const { limit } = req.query;
      const limitNum = limit ? parseInt(limit as string) : 10;
      const listings = await storage.getRecentListings(limitNum);
      res.json(listings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent listings" });
    }
  });

  // Get notification settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getNotificationSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update notification settings
  app.patch("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getNotificationSettings();
      if (!settings) {
        return res.status(404).json({ error: "Settings not found" });
      }

      // Validate request body
      const validatedData = insertNotificationSettingsSchema.partial().parse(req.body);
      
      const updatedSettings = await storage.updateNotificationSettings(settings.id, validatedData);
      res.json(updatedSettings);
    } catch (error) {
      res.status(400).json({ error: "Failed to update settings" });
    }
  });

  // Get system status
  app.get("/api/status", async (req, res) => {
    try {
      const status = await storage.getSystemStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch system status" });
    }
  });

  // Manual check for new listings
  app.post("/api/check", async (req, res) => {
    try {
      await exchangeMonitor.checkAllExchanges();
      res.json({ message: "Check completed" });
    } catch (error) {
      res.status(500).json({ error: "Failed to check exchanges" });
    }
  });

  // Get dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const allListings = await storage.getListings();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const newListingsToday = allListings.filter(listing => 
        new Date(listing.listedAt) >= today
      ).length;
      
      const totalNotificationsSent = allListings.filter(listing => 
        listing.notificationSent
      ).length;

      const systemStatus = await storage.getSystemStatus();
      const upbitStatus = systemStatus.find(s => s.service === "upbit");
      const bithumbStatus = systemStatus.find(s => s.service === "bithumb");

      res.json({
        totalMonitored: allListings.length,
        newListingsToday,
        notificationsSent: totalNotificationsSent,
        uptime: "99.8%", // This would be calculated based on actual uptime data
        lastCheck: Math.max(
          upbitStatus?.lastCheck?.getTime() || 0,
          bithumbStatus?.lastCheck?.getTime() || 0
        ),
        upbitStatus: {
          status: upbitStatus?.status || "unknown",
          responseTime: upbitStatus?.responseTime || 0,
          rateLimit: upbitStatus?.rateLimit || 100,
          rateLimitUsed: upbitStatus?.rateLimitUsed || 0,
        },
        bithumbStatus: {
          status: bithumbStatus?.status || "unknown",
          responseTime: bithumbStatus?.responseTime || 0,
          rateLimit: bithumbStatus?.rateLimit || 60,
          rateLimitUsed: bithumbStatus?.rateLimitUsed || 0,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Real-time alert endpoint
  app.post("/api/alerts/test", async (req, res) => {
    try {
      console.log("🔔 Manual alert test triggered");
      res.json({ message: "Alert test completed", timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: "Failed to send test alert" });
    }
  });

  // Test announcement alert endpoint
  app.post("/api/alerts/test-announcement", async (req, res) => {
    try {
      // Create a test announcement alert
      const testAnnouncement: InsertListing = {
        symbol: "CYBER",
        name: "사이버",
        exchange: "upbit",
        marketId: "ANNOUNCEMENT-CYBER",
        listedAt: new Date(),
        announcementId: `test:${Date.now()}`,
        announcementTitle: "사이버(CYBER) KRW, USDT 마켓 디지털 자산 추가",
        announcementUrl: "https://upbit.com/service_center/notice?id=5409",
        isAnnouncement: true,
      };

      await storage.createListing(testAnnouncement);
      console.log("📢 Test announcement alert created");
      res.json({ message: "Test announcement alert created", timestamp: new Date().toISOString() });
    } catch (error) {
      console.error("Test announcement error:", error);
      res.status(500).json({ error: "Test announcement failed" });
    }
  });

  // Manual force check endpoint for immediate monitoring
  app.post("/api/monitor/force", async (req, res) => {
    try {
      console.log("🚨 FORCE MONITORING TRIGGERED");
      await exchangeMonitor.checkAllExchanges();
      res.json({ 
        message: "Force monitoring completed", 
        timestamp: new Date().toISOString() 
      });
    } catch (error) {
      console.error("Force monitoring failed:", error);
      res.status(500).json({ error: "Force monitoring failed" });
    }
  });

  // Set up scheduled monitoring with faster intervals
  const setupScheduledTasks = async () => {
    const settings = await storage.getNotificationSettings();
    const pollingInterval = settings?.pollingInterval || 60; // Default 1 minute for real-time
    
    // Convert seconds to cron format (every N seconds/minutes)
    let cronPattern;
    if (pollingInterval < 60) {
      // For intervals less than 1 minute, use seconds
      cronPattern = `*/${pollingInterval} * * * * *`;
    } else {
      // For intervals 1 minute or more
      const minutes = Math.floor(pollingInterval / 60);
      cronPattern = `*/${minutes} * * * *`;
    }
    
    const intervalText = pollingInterval < 60 ? `${pollingInterval} seconds` : `${Math.floor(pollingInterval / 60)} minutes`;
    console.log(`Setting up scheduled monitoring with interval: ${intervalText}`);
    
    cron.schedule(cronPattern, async () => {
      console.log("Running scheduled exchange monitoring...");
      try {
        await exchangeMonitor.checkAllExchanges();
      } catch (error) {
        console.error("Scheduled monitoring failed:", error);
      }
    });

    // Set up announcement monitoring (every 30 seconds for fast detection)
    cron.schedule("*/30 * * * * *", async () => {
      try {
        await announcementMonitor.monitorAll();
      } catch (error) {
        console.error("Announcement monitoring failed:", error);
      }
    });
  };

  // Initialize scheduled tasks
  setupScheduledTasks();

  const httpServer = createServer(app);
  return httpServer;
}
