import { ZapConfig } from "./zap_config";

/**
 * Configuration parameters for Alchemy API
 */
export interface AlchemyConfigParams {
  apiKey?: string;
}

/**
 * Configuration class for Alchemy API
 */
export class AlchemyConfig {
  private static instance: AlchemyConfig | null = null;
  private readonly apiKey: string;

  /**
   * Creates a new AlchemyConfig instance.
   *
   * @param params - Optional configuration parameters for Alchemy API
   */
  private constructor(params?: AlchemyConfigParams) {
    try {
      // First try to get API key from params
      if (params?.apiKey) {
        this.apiKey = params.apiKey;
        return;
      }

      // Then try to get from ZapConfig
      const zapConfig = ZapConfig.getInstance();
      if (!zapConfig) {
        throw new Error("ZapConfig not initialized");
      }
      this.apiKey = zapConfig.getAlchemyApiKey();
    } catch (error) {
      throw new Error(
        "Failed to initialize AlchemyConfig: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  }

  /**
   * Get the singleton instance of AlchemyConfig
   * @param params Optional configuration parameters for Alchemy API
   * @returns The AlchemyConfig instance
   */
  public static getInstance(params?: AlchemyConfigParams): AlchemyConfig {
    if (!AlchemyConfig.instance) {
      AlchemyConfig.instance = new AlchemyConfig(params);
    }
    return AlchemyConfig.instance;
  }

  /**
   * Reset the singleton instance
   */
  public static resetInstance(): void {
    AlchemyConfig.instance = null;
  }

  /**
   * Get the Alchemy API key
   * @returns The API key or throw an error if not set
   */
  public getApiKey(): string {
    if (!this.apiKey) {
      throw new Error(
        "Alchemy API key not found. Please provide it via constructor or set ALCHEMY_API_KEY environment variable.",
      );
    }
    return this.apiKey;
  }
} 