import { ZapConfig } from "./zap_config";

// hyperbolic_config.ts
export interface HyperbolicConfigParams {
  apiKey?: string;
}

/**
 * Configuration class for Hyperbolic API integration.
 */
export class HyperbolicConfig {
  private static instance: HyperbolicConfig | null = null;
  private readonly apiKey: string;

  /**
   * Creates a new HyperbolicConfig instance.
   *
   * @param params - Optional configuration parameters for Hyperbolic API
   */
  private constructor(params?: HyperbolicConfigParams) {
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
      this.apiKey = zapConfig.getHyperbolicApiKey();
    } catch (error) {
      throw new Error(
        "Failed to initialize HyperbolicConfig: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  }

  /**
   * Gets the singleton instance of HyperbolicConfig.
   *
   * @param params - Optional configuration parameters for Hyperbolic API
   * @returns The HyperbolicConfig instance
   */
  public static getInstance(params?: HyperbolicConfigParams): HyperbolicConfig {
    if (!HyperbolicConfig.instance) {
      HyperbolicConfig.instance = new HyperbolicConfig(params);
    }
    return HyperbolicConfig.instance;
  }

  /**
   * Resets the singleton instance of HyperbolicConfig to null.
   * This allows for re-initialization of the config with new parameters.
   */
  public static resetInstance(): void {
    HyperbolicConfig.instance = null;
  }

  /**
   * Gets the Hyperbolic API key.
   *
   * @returns The Hyperbolic API key string
   */
  public getApiKey(): string {
    if (!this.apiKey) {
      throw new Error(
        "Hyperbolic API key not found. Please provide it via constructor or set HYPERBOLIC_API_KEY environment variable.",
      );
    }
    return this.apiKey;
  }
}
