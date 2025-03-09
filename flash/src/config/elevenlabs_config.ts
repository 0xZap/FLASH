/**
 * Configuration for ElevenLabs API.
 */
export class ElevenLabsConfig {
  private static instance: ElevenLabsConfig | null = null;
  private apiKey: string | null = null;

  private constructor(config?: { apiKey?: string }) {
    if (config?.apiKey) {
      this.apiKey = config.apiKey;
    }
  }

  /**
   * Gets the singleton instance of the ElevenLabs config.
   * @param config Optional configuration
   * @returns The ElevenLabs config instance
   */
  public static getInstance(config?: { apiKey?: string }): ElevenLabsConfig {
    if (!ElevenLabsConfig.instance) {
      ElevenLabsConfig.instance = new ElevenLabsConfig(config);
    } else if (config) {
      if (config.apiKey) {
        ElevenLabsConfig.instance.apiKey = config.apiKey;
      }
    }
    return ElevenLabsConfig.instance;
  }

  /**
   * Resets the singleton instance.
   */
  public static resetInstance(): void {
    ElevenLabsConfig.instance = null;
  }

  /**
   * Gets the API key.
   * @returns The API key or null if not set
   */
  public getApiKey(): string | null {
    return this.apiKey || process.env.ELEVENLABS_API_KEY || null;
  }
} 