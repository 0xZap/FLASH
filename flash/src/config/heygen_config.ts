/**
 * Configuration for HeyGen API.
 */
export class HeyGenConfig {
  private static instance: HeyGenConfig | null = null;
  private apiKey: string | null = null;

  private constructor(config?: { apiKey?: string }) {
    if (config?.apiKey) {
      this.apiKey = config.apiKey;
    }
  }

  /**
   * Gets the singleton instance of the HeyGen config.
   * @param config Optional configuration
   * @returns The HeyGen config instance
   */
  public static getInstance(config?: { apiKey?: string }): HeyGenConfig {
    if (!HeyGenConfig.instance) {
      HeyGenConfig.instance = new HeyGenConfig(config);
    } else if (config) {
      if (config.apiKey) {
        HeyGenConfig.instance.apiKey = config.apiKey;
      }
    }
    return HeyGenConfig.instance;
  }

  /**
   * Resets the singleton instance.
   */
  public static resetInstance(): void {
    HeyGenConfig.instance = null;
  }

  /**
   * Gets the API key.
   * @returns The API key or null if not set
   */
  public getApiKey(): string | null {
    return this.apiKey || process.env.HEYGEN_API_KEY || null;
  }
} 