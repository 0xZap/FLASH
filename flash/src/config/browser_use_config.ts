/**
 * Configuration for Browser Use API.
 */
export class BrowserUseConfig {
  private static instance: BrowserUseConfig | null = null;
  private apiKey: string | null = null;
  private baseUrl: string = "https://api.browser-use.com/api/v1";

  private constructor(config?: { apiKey?: string; baseUrl?: string }) {
    if (config?.apiKey) {
      this.apiKey = config.apiKey;
    }
    if (config?.baseUrl) {
      this.baseUrl = config.baseUrl;
    }
  }

  /**
   * Gets the singleton instance of the Browser Use config.
   * @param config Optional configuration
   * @returns The Browser Use config instance
   */
  public static getInstance(config?: { apiKey?: string; baseUrl?: string }): BrowserUseConfig {
    if (!BrowserUseConfig.instance) {
      BrowserUseConfig.instance = new BrowserUseConfig(config);
    } else if (config) {
      if (config.apiKey) {
        BrowserUseConfig.instance.apiKey = config.apiKey;
      }
      if (config.baseUrl) {
        BrowserUseConfig.instance.baseUrl = config.baseUrl;
      }
    }
    return BrowserUseConfig.instance;
  }

  /**
   * Resets the singleton instance.
   */
  public static resetInstance(): void {
    BrowserUseConfig.instance = null;
  }

  /**
   * Gets the API key.
   * @returns The API key or null if not set
   */
  public getApiKey(): string | null {
    return this.apiKey || process.env.BROWSER_USE_API_KEY || null;
  }

  /**
   * Gets the base URL.
   * @returns The base URL
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }
} 