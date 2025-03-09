/**
 * Configuration for Perplexity API.
 */
export class PerplexityConfig {
  private static instance: PerplexityConfig | null = null;
  private apiKey: string | null = null;

  private constructor(config?: { apiKey?: string }) {
    if (config?.apiKey) {
      this.apiKey = config.apiKey;
    }
  }

  /**
   * Gets the singleton instance of the Perplexity config.
   * @param config Optional configuration
   * @returns The Perplexity config instance
   */
  public static getInstance(config?: { apiKey?: string }): PerplexityConfig {
    if (!PerplexityConfig.instance) {
      PerplexityConfig.instance = new PerplexityConfig(config);
    } else if (config) {
      if (config.apiKey) {
        PerplexityConfig.instance.apiKey = config.apiKey;
      }
    }
    return PerplexityConfig.instance;
  }

  /**
   * Resets the singleton instance.
   */
  public static resetInstance(): void {
    PerplexityConfig.instance = null;
  }

  /**
   * Gets the API key.
   * @returns The API key or null if not set
   */
  public getApiKey(): string | null {
    return this.apiKey || process.env.PERPLEXITY_API_KEY || null;
  }
} 