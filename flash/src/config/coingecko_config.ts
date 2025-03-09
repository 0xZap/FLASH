import { ZapConfig } from "./zap_config";

/**
 * Configuration for CoinGecko API
 * 
 * This class manages the API keys and other configuration for both
 * the regular CoinGecko API and the CoinGecko Pro API.
 */
export class CoinGeckoConfig {
  private static instance: CoinGeckoConfig;
  
  // Regular CoinGecko API key (for higher rate limits on free endpoints)
  private apiKey: string | null = null;
  
  // CoinGecko Pro API key (for paid endpoints)
  private proApiKey: string | null = null;
  
  // Reference to ZapConfig for any shared configuration
  private zapConfig: ZapConfig;

  private constructor() {
    // Use composition instead of inheritance
    this.zapConfig = ZapConfig.getInstance();
  }

  /**
   * Get the singleton instance of CoinGeckoConfig
   * @returns The CoinGeckoConfig instance
   */
  public static getInstance(): CoinGeckoConfig {
    if (!CoinGeckoConfig.instance) {
      CoinGeckoConfig.instance = new CoinGeckoConfig();
    }
    return CoinGeckoConfig.instance;
  }

  /**
   * Set the regular CoinGecko API key
   * @param apiKey The API key to set
   */
  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Get the regular CoinGecko API key
   * @returns The API key or null if not set
   */
  public getApiKey(): string | null {
    return this.apiKey;
  }

  /**
   * Check if the regular API key is set
   * @returns True if the API key is set, false otherwise
   */
  public hasApiKey(): boolean {
    return this.apiKey !== null && this.apiKey.length > 0;
  }

  /**
   * Set the CoinGecko Pro API key
   * @param proApiKey The Pro API key to set
   */
  public setProApiKey(proApiKey: string): void {
    this.proApiKey = proApiKey;
  }

  /**
   * Get the CoinGecko Pro API key
   * @returns The Pro API key or null if not set
   */
  public getProApiKey(): string | null {
    return this.proApiKey;
  }

  /**
   * Check if the Pro API key is set
   * @returns True if the Pro API key is set, false otherwise
   */
  public hasProApiKey(): boolean {
    return this.proApiKey !== null && this.proApiKey.length > 0;
  }

  /**
   * Get the base URL for regular CoinGecko API
   * @returns The base URL for regular API requests
   */
  public getBaseUrl(): string {
    return "https://api.coingecko.com/api/v3";
  }

  /**
   * Get the base URL for CoinGecko Pro API
   * @returns The Pro API base URL
   */
  public getProBaseUrl(): string {
    return "https://pro-api.coingecko.com/api/v3";
  }

  /**
   * Get the appropriate API URL based on whether a regular API key is available
   * This is for endpoints that work with both free and paid tiers
   * @returns The API URL to use
   */
  public getApiUrl(): string {
    return this.hasApiKey() ? this.getBaseUrl() + "?x-cg-api-key=" + this.apiKey : this.getBaseUrl();
  }

  /**
   * Get the appropriate API URL and headers for Pro API endpoints
   * @returns An object containing the URL and headers for Pro API requests
   */
  public getProApiConfig(): { url: string; headers: Record<string, string> } {
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    if (this.hasProApiKey()) {
      headers['x-cg-pro-api-key'] = this.proApiKey as string;
    } else if (this.hasApiKey()) {
      // Fall back to regular API key if Pro key is not available
      headers['x-cg-pro-api-key'] = this.apiKey as string;
    }

    return {
      url: this.getProBaseUrl(),
      headers
    };
  }
} 