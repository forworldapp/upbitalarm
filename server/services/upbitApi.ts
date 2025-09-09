import crypto from 'crypto';
import jwt from 'jsonwebtoken';

interface UpbitMarket {
  market: string;
  korean_name: string;
  english_name: string;
  market_warning?: string;
}

export class UpbitApi {
  private baseUrl = 'https://api.upbit.com/v1';
  private accessKey = process.env.UPBIT_ACCESS_KEY;
  private secretKey = process.env.UPBIT_SECRET_KEY;

  private generateAuthToken(queryString: string = ''): string {
    if (!this.accessKey || !this.secretKey) {
      console.warn('Upbit API keys not configured, using public endpoints only');
      return '';
    }

    try {
      const payload: any = {
        access_key: this.accessKey,
        nonce: crypto.randomUUID(),
      };

      if (queryString) {
        const hash = crypto.createHash('sha512');
        hash.update(queryString, 'utf8');
        payload.query_hash = hash.digest('hex');
        payload.query_hash_alg = 'SHA512';
      }

      const token = jwt.sign(payload, this.secretKey);
      return `Bearer ${token}`;
    } catch (error) {
      console.error('Error generating auth token:', error);
      return '';
    }
  }

  async getAllMarkets(): Promise<UpbitMarket[]> {
    try {
      const response = await fetch(`${this.baseUrl}/market/all?isDetails=true`, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching markets:', error);
      throw error;
    }
  }

  async getKRWMarkets(): Promise<UpbitMarket[]> {
    const allMarkets = await this.getAllMarkets();
    return allMarkets.filter(market => market.market.startsWith('KRW-'));
  }

  async getNewListings(knownMarkets: Set<string>): Promise<UpbitMarket[]> {
    const currentMarkets = await this.getKRWMarkets();
    const newMarkets: UpbitMarket[] = [];

    for (const market of currentMarkets) {
      if (!knownMarkets.has(market.market)) {
        newMarkets.push(market);
        console.log(`🆕 New market detected: ${market.market} - ${market.korean_name}`);
      }
    }

    return newMarkets;
  }

  async getTicker(market: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/ticker?markets=${market}`, {
        headers: {
          'Accept': 'application/json',
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

  async getRecentCandles(market: string, count: number = 10): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/candles/minutes/1?market=${market}&count=${count}`, {
        headers: {
          'Accept': 'application/json',
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
}

export const upbitApi = new UpbitApi();