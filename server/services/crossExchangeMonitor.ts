import { storage } from "../storage";
import { type Listing } from "@shared/schema";

interface ExchangeAsset {
  symbol: string;
  name: string;
  depositEnabled?: boolean;
  withdrawEnabled?: boolean;
  network?: string;
}

interface BinanceAsset {
  coin: string;
  name: string;
  networkList: Array<{
    network: string;
    depositEnable: boolean;
    withdrawEnable: boolean;
  }>;
}

interface BybitAsset {
  name: string;
  coin: string;
  chains: Array<{
    chain: string;
    chainDeposit: "1" | "0";
    chainWithdraw: "1" | "0";
  }>;
}

export class CrossExchangeMonitor {
  private binanceApiUrl = "https://api.binance.com/sapi/v1";
  private bybitApiUrl = "https://api.bybit.com/v5";
  private okxApiUrl = "https://www.okx.com/api/v5";
  private gateApiUrl = "https://api.gateio.ws/api/v4";
  private kucoinApiUrl = "https://api.kucoin.com/api/v1";
  private huobiApiUrl = "https://api.huobi.pro/v1";

  async checkCrossExchangeAvailability(symbol: string): Promise<{
    binance: boolean;
    bybit: boolean;
    okx: boolean;
    gate: boolean;
    kucoin: boolean;
    huobi: boolean;
    depositWithdrawStatus: {
      binanceDeposit: boolean;
      binanceWithdraw: boolean;
      bybitDeposit: boolean;
      bybitWithdraw: boolean;
    };
  }> {
    console.log(`Checking cross-exchange availability for ${symbol}...`);
    
    const results = await Promise.allSettled([
      this.checkBinance(symbol),
      this.checkBybit(symbol),
      this.checkOKX(symbol),
      this.checkGate(symbol),
      this.checkKucoin(symbol),
      this.checkHuobi(symbol),
    ]);

    const [binanceResult, bybitResult, okxResult, gateResult, kucoinResult, huobiResult] = results;

    return {
      binance: binanceResult.status === 'fulfilled' && binanceResult.value.available,
      bybit: bybitResult.status === 'fulfilled' && bybitResult.value.available,
      okx: okxResult.status === 'fulfilled' && okxResult.value.available,
      gate: gateResult.status === 'fulfilled' && gateResult.value.available,
      kucoin: kucoinResult.status === 'fulfilled' && kucoinResult.value.available,
      huobi: huobiResult.status === 'fulfilled' && huobiResult.value.available,
      depositWithdrawStatus: {
        binanceDeposit: binanceResult.status === 'fulfilled' ? binanceResult.value.depositEnabled : false,
        binanceWithdraw: binanceResult.status === 'fulfilled' ? binanceResult.value.withdrawEnabled : false,
        bybitDeposit: bybitResult.status === 'fulfilled' ? bybitResult.value.depositEnabled : false,
        bybitWithdraw: bybitResult.status === 'fulfilled' ? bybitResult.value.withdrawEnabled : false,
      }
    };
  }

  private async checkBinance(symbol: string): Promise<{
    available: boolean;
    depositEnabled: boolean;
    withdrawEnabled: boolean;
  }> {
    try {
      const response = await fetch(`${this.binanceApiUrl}/capital/config/getall`);
      if (!response.ok) throw new Error(`Binance API error: ${response.status}`);
      
      const assets: BinanceAsset[] = await response.json();
      const asset = assets.find(a => a.coin.toUpperCase() === symbol.toUpperCase());
      
      if (!asset) return { available: false, depositEnabled: false, withdrawEnabled: false };
      
      // Check if any network allows deposits/withdrawals
      const hasDepositNetwork = asset.networkList.some(n => n.depositEnable);
      const hasWithdrawNetwork = asset.networkList.some(n => n.withdrawEnable);
      
      return {
        available: true,
        depositEnabled: hasDepositNetwork,
        withdrawEnabled: hasWithdrawNetwork,
      };
    } catch (error) {
      console.error(`Error checking Binance for ${symbol}:`, error);
      return { available: false, depositEnabled: false, withdrawEnabled: false };
    }
  }

  private async checkBybit(symbol: string): Promise<{
    available: boolean;
    depositEnabled: boolean;
    withdrawEnabled: boolean;
  }> {
    try {
      const response = await fetch(`${this.bybitApiUrl}/asset/coin/query-info?coin=${symbol}`);
      if (!response.ok) throw new Error(`Bybit API error: ${response.status}`);
      
      const data = await response.json();
      if (data.retCode !== 0 || !data.result?.rows?.length) {
        return { available: false, depositEnabled: false, withdrawEnabled: false };
      }
      
      const asset = data.result.rows[0];
      const hasDepositChain = asset.chains?.some((c: any) => c.chainDeposit === "1");
      const hasWithdrawChain = asset.chains?.some((c: any) => c.chainWithdraw === "1");
      
      return {
        available: true,
        depositEnabled: hasDepositChain,
        withdrawEnabled: hasWithdrawChain,
      };
    } catch (error) {
      console.error(`Error checking Bybit for ${symbol}:`, error);
      return { available: false, depositEnabled: false, withdrawEnabled: false };
    }
  }

  private async checkOKX(symbol: string): Promise<{
    available: boolean;
    depositEnabled: boolean;
    withdrawEnabled: boolean;
  }> {
    try {
      const response = await fetch(`${this.okxApiUrl}/asset/currencies?ccy=${symbol}`);
      if (!response.ok) throw new Error(`OKX API error: ${response.status}`);
      
      const data = await response.json();
      if (data.code !== "0" || !data.data?.length) {
        return { available: false, depositEnabled: false, withdrawEnabled: false };
      }
      
      const asset = data.data[0];
      return {
        available: true,
        depositEnabled: asset.canDep === true,
        withdrawEnabled: asset.canWd === true,
      };
    } catch (error) {
      console.error(`Error checking OKX for ${symbol}:`, error);
      return { available: false, depositEnabled: false, withdrawEnabled: false };
    }
  }

  private async checkGate(symbol: string): Promise<{
    available: boolean;
    depositEnabled: boolean;
    withdrawEnabled: boolean;
  }> {
    try {
      const response = await fetch(`${this.gateApiUrl}/wallet/currency_chains?currency=${symbol}`);
      if (!response.ok) throw new Error(`Gate API error: ${response.status}`);
      
      const chains = await response.json();
      if (!Array.isArray(chains) || chains.length === 0) {
        return { available: false, depositEnabled: false, withdrawEnabled: false };
      }
      
      // Check if any chain allows deposits/withdrawals
      const hasDepositChain = chains.some(c => c.is_deposit_disabled === false);
      const hasWithdrawChain = chains.some(c => c.is_withdraw_disabled === false);
      
      return {
        available: true,
        depositEnabled: hasDepositChain,
        withdrawEnabled: hasWithdrawChain,
      };
    } catch (error) {
      console.error(`Error checking Gate for ${symbol}:`, error);
      return { available: false, depositEnabled: false, withdrawEnabled: false };
    }
  }

  private async checkKucoin(symbol: string): Promise<{
    available: boolean;
    depositEnabled: boolean;
    withdrawEnabled: boolean;
  }> {
    try {
      const response = await fetch(`${this.kucoinApiUrl}/currencies/${symbol}`);
      if (!response.ok) throw new Error(`KuCoin API error: ${response.status}`);
      
      const data = await response.json();
      if (data.code !== "200000" || !data.data) {
        return { available: false, depositEnabled: false, withdrawEnabled: false };
      }
      
      const asset = data.data;
      return {
        available: true,
        depositEnabled: asset.isDepositEnabled === true,
        withdrawEnabled: asset.isWithdrawEnabled === true,
      };
    } catch (error) {
      console.error(`Error checking KuCoin for ${symbol}:`, error);
      return { available: false, depositEnabled: false, withdrawEnabled: false };
    }
  }

  private async checkHuobi(symbol: string): Promise<{
    available: boolean;
    depositEnabled: boolean;
    withdrawEnabled: boolean;
  }> {
    try {
      const response = await fetch(`${this.huobiApiUrl}/common/currencys`);
      if (!response.ok) throw new Error(`Huobi API error: ${response.status}`);
      
      const data = await response.json();
      if (data.status !== "ok" || !data.data) {
        return { available: false, depositEnabled: false, withdrawEnabled: false };
      }
      
      const asset = data.data.find((c: any) => c.currency?.toUpperCase() === symbol.toUpperCase());
      if (!asset) return { available: false, depositEnabled: false, withdrawEnabled: false };
      
      return {
        available: true,
        depositEnabled: asset["deposit-enabled"] === true,
        withdrawEnabled: asset["withdraw-enabled"] === true,
      };
    } catch (error) {
      console.error(`Error checking Huobi for ${symbol}:`, error);
      return { available: false, depositEnabled: false, withdrawEnabled: false };
    }
  }

  async updateListingWithCrossExchangeData(listing: Listing): Promise<void> {
    const crossExchangeData = await this.checkCrossExchangeAvailability(listing.symbol);
    
    await storage.updateListing(listing.id, {
      binanceAvailable: crossExchangeData.binance,
      bybitAvailable: crossExchangeData.bybit,
      okxAvailable: crossExchangeData.okx,
      gateAvailable: crossExchangeData.gate,
      kucoinAvailable: crossExchangeData.kucoin,
      huobiAvailable: crossExchangeData.huobi,
    });

    console.log(`Updated cross-exchange data for ${listing.symbol}:`, {
      binance: crossExchangeData.binance,
      bybit: crossExchangeData.bybit,
      okx: crossExchangeData.okx,
      gate: crossExchangeData.gate,
      kucoin: crossExchangeData.kucoin,
      huobi: crossExchangeData.huobi,
      depositWithdraw: crossExchangeData.depositWithdrawStatus,
    });
  }

  async checkTargetExchangeDepositWithdraw(symbol: string): Promise<{
    upbitDeposit: boolean;
    upbitWithdraw: boolean;
    bithumbDeposit: boolean;
    bithumbWithdraw: boolean;
  }> {
    // For now, we'll return default values since Upbit/Bithumb don't provide public APIs for this
    // In production, you might need to scrape their support pages or use unofficial APIs
    return {
      upbitDeposit: true, // Assume enabled by default for new listings
      upbitWithdraw: true,
      bithumbDeposit: true,
      bithumbWithdraw: true,
    };
  }
}

export const crossExchangeMonitor = new CrossExchangeMonitor();