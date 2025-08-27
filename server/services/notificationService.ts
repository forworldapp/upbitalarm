import { storage } from "../storage";
import { type Listing, type NotificationSettings } from "@shared/schema";

export class NotificationService {
  private emailApiKey: string;
  private telegramBotToken: string;
  private soundAlertPlayed: Set<string> = new Set();
  
  constructor() {
    this.emailApiKey = process.env.EMAIL_API_KEY || process.env.SENDGRID_API_KEY || "";
    this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || "";
  }

  async sendImmediateNotification(listing: Listing): Promise<void> {
    const settings = await storage.getNotificationSettings();
    if (!settings || !settings.instantNotifications) return;

    console.log(`🔔 IMMEDIATE ALERT: New ${listing.exchange.toUpperCase()} listing - ${listing.name} (${listing.symbol})`);
    
    // Send all notification types immediately for new listings
    await this.sendNotifications(listing);
    
    // Log the immediate alert
    await this.logAlert(listing, "IMMEDIATE_LISTING_ALERT");
  }

  private async logAlert(listing: Listing, alertType: string): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${alertType}: ${listing.exchange.toUpperCase()} - ${listing.name} (${listing.symbol}) - Market: ${listing.marketId}`);
  }

  async sendNotifications(listing: Listing): Promise<void> {
    const settings = await storage.getNotificationSettings();
    if (!settings) return;

    const promises: Promise<void>[] = [];

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
    
    // Mark listing as notified
    await storage.updateListing(listing.id, { notificationSent: true });
  }

  private async sendEmailNotification(listing: Listing, settings: NotificationSettings): Promise<void> {
    try {
      const subject = `새로운 암호화폐 상장: ${listing.name} (${listing.symbol})`;
      const body = this.generateEmailBody(listing);

      // Note: In production, implement actual email sending
      // For now, just log the notification
      console.log(`📧 Email notification would be sent to ${settings.emailAddress}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body}`);
      
    } catch (error) {
      console.error("Failed to send email notification:", error);
    }
  }

  private async sendTelegramNotification(listing: Listing, settings: NotificationSettings): Promise<void> {
    try {
      const message = this.generateTelegramMessage(listing);
      
      if (!this.telegramBotToken) {
        console.log("⚠️ Telegram bot token not configured");
        return;
      }

      const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: message,
          parse_mode: "Markdown",
        }),
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`);
      }

      console.log(`✅ Telegram notification sent to ${settings.telegramChatId}`);
      
    } catch (error) {
      console.error("Failed to send Telegram notification:", error);
    }
  }

  private async sendDiscordNotification(listing: Listing, settings: NotificationSettings): Promise<void> {
    try {
      const embed = this.generateDiscordEmbed(listing);
      
      const response = await fetch(settings.discordWebhookUrl!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [embed],
        }),
      });

      if (!response.ok) {
        throw new Error(`Discord webhook error: ${response.status}`);
      }

      console.log(`✅ Discord notification sent`);
      
    } catch (error) {
      console.error("Failed to send Discord notification:", error);
    }
  }

  private generateEmailBody(listing: Listing): string {
    const exchangeName = listing.exchange === "upbit" ? "업비트" : "빗썸";
    
    return `
      새로운 암호화폐가 ${exchangeName}에 상장되었습니다!
      
      코인명: ${listing.name}
      심볼: ${listing.symbol}
      거래소: ${exchangeName}
      상장일시: ${listing.listedAt.toLocaleString("ko-KR")}
      마켓 ID: ${listing.marketId}
      
      ${listing.currentPrice ? `현재 가격: ₩${listing.currentPrice}` : ""}
      ${listing.priceChangePercent ? `변동률: ${listing.priceChangePercent}%` : ""}
      
      이 알림은 Crypto Listing Monitor에서 자동으로 발송되었습니다.
    `;
  }

  private generateTelegramMessage(listing: Listing): string {
    const exchangeName = listing.exchange === "upbit" ? "업비트" : "빗썸";
    const exchangeEmoji = listing.exchange === "upbit" ? "🔵" : "🟡";
    
    let message = `🚨 *긴급 상장 알림* ${exchangeEmoji}\n\n`;
    message += `💰 **${listing.name}** (${listing.symbol})\n`;
    message += `🏢 거래소: ${exchangeName}\n`;
    message += `⏰ 상장일시: ${listing.listedAt.toLocaleString("ko-KR")}\n`;
    message += `🆔 마켓 ID: \`${listing.marketId}\`\n`;
    
    if (listing.currentPrice) {
      message += `💵 현재 가격: ₩${listing.currentPrice}\n`;
    }
    
    if (listing.priceChangePercent) {
      const changeEmoji = parseFloat(listing.priceChangePercent) >= 0 ? "📈" : "📉";
      message += `${changeEmoji} 변동률: ${listing.priceChangePercent}%\n`;
    }
    
    // Add cross-exchange availability info
    const availableExchanges = [];
    if (listing.binanceAvailable) availableExchanges.push("바이낸스");
    if (listing.bybitAvailable) availableExchanges.push("바이비트");
    if (listing.okxAvailable) availableExchanges.push("OKX");
    if (listing.gateAvailable) availableExchanges.push("Gate.io");
    if (listing.kucoinAvailable) availableExchanges.push("KuCoin");
    if (listing.huobiAvailable) availableExchanges.push("후오비");
    
    if (availableExchanges.length > 0) {
      message += `\n🔄 *다른 거래소 보유 현황:*\n`;
      message += `✅ ${availableExchanges.join(", ")}에서 거래 가능\n`;
      message += `\n💡 *즉시 액션 필요:*\n`;
      message += `1️⃣ 위 거래소에서 ${listing.symbol} 즉시 출금\n`;
      message += `2️⃣ ${exchangeName}로 빠른 입금\n`;
      message += `3️⃣ 상장 초기 가격에 매도 고려\n`;
    }
    
    message += `\n⚡ *시간이 중요합니다! 지금 즉시 행동하세요!*`;
    
    return message;
  }

  private generateDiscordEmbed(listing: Listing): any {
    const exchangeName = listing.exchange === "upbit" ? "업비트" : "빗썸";
    const color = listing.exchange === "upbit" ? 0x1976D2 : 0xF57C00;
    
    return {
      title: `🚀 새로운 상장: ${listing.name}`,
      description: `${listing.symbol}이(가) ${exchangeName}에 상장되었습니다!`,
      color: color,
      fields: [
        {
          name: "거래소",
          value: exchangeName,
          inline: true,
        },
        {
          name: "심볼",
          value: listing.symbol,
          inline: true,
        },
        {
          name: "마켓 ID",
          value: listing.marketId,
          inline: true,
        },
        {
          name: "상장일시",
          value: listing.listedAt.toLocaleString("ko-KR"),
          inline: false,
        },
      ],
      timestamp: listing.listedAt.toISOString(),
      footer: {
        text: "Crypto Listing Monitor",
      },
    };
  }
}

export const notificationService = new NotificationService();
