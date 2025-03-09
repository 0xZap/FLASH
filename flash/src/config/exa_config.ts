import { ZapConfig } from "./zap_config";

/**
 * Configuration class for Exa API
 */
export interface ExaConfigParams {
  apiKey?: string;
}

export class ExaConfig {
  private static instance: ExaConfig | null = null;
  private readonly apiKey: string;

  /**
   * Creates a new ExaConfig instance.
   *
   * @param params - Optional configuration parameters for Exa API
   */
  private constructor(params?: ExaConfigParams) {
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
      this.apiKey = zapConfig.getExaApiKey();
    } catch (error) {
      throw new Error(
        "Failed to initialize ExaConfig: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  }

  /**
   * Get the singleton instance of ExaConfig
   * @param params Optional configuration parameters for Exa API
   * @returns The ExaConfig instance
   */
  public static getInstance(params?: ExaConfigParams): ExaConfig {
    if (!ExaConfig.instance) {
      ExaConfig.instance = new ExaConfig(params);
    }
    return ExaConfig.instance;
  }

  /**
   * Reset the singleton instance
   */
  public static resetInstance(): void {
    ExaConfig.instance = null;
  }

  /**
   * Get the Exa API key
   * @returns The API key or null if not set
   */
  public getApiKey(): string {
    if (!this.apiKey) {
      throw new Error(
        "Exa API key not found. Please provide it via constructor or set EXA_API_KEY environment variable.",
      );
    }
    return this.apiKey;
  }
} 