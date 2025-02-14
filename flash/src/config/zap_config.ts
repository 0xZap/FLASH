import { z } from "zod";

export interface ZapConfigParams {
  hyperbolicApiKey?: string;
  evmApiKey?: string;
  googleToken?: string;
  telegramApiKey?: string;
  twitterApiKey?: string;
}

const ConfigSchema = z.object({
  hyperbolicApiKey: z.string().optional(),
  evmApiKey: z.string().optional(),
  googleToken: z.string().optional(),
  telegramApiKey: z.string().optional(),
  twitterApiKey: z.string().optional(),
});

/**
 * Configuration class for managing API keys and tokens using the Singleton pattern.
 */
export class ZapConfig {
  private static instance: ZapConfig | null = null;
  private readonly config: ZapConfigParams;

  /**
   * Private constructor to initialize the configuration with optional parameters.
   *
   * @param params - Optional configuration parameters that override environment variables
   */
  private constructor(params?: ZapConfigParams) {
    // First try params, then env vars
    this.config = {
      hyperbolicApiKey: params?.hyperbolicApiKey ?? process.env.HYPERBOLIC_API_KEY,
      evmApiKey: params?.evmApiKey ?? process.env.EVM_API_KEY,
      googleToken: params?.googleToken ?? process.env.GOOGLE_TOKEN,
      telegramApiKey: params?.telegramApiKey ?? process.env.TELEGRAM_API_KEY,
      twitterApiKey: params?.twitterApiKey ?? process.env.TWITTER_API_KEY,
    };

    // Validate the config
    ConfigSchema.parse(this.config);
  }

  /**
   * Gets the singleton instance of ZapConfig, creating it if it doesn't exist.
   *
   * @param params - Optional configuration parameters that override environment variables
   * @returns The singleton instance of ZapConfig
   */
  public static getInstance(params?: ZapConfigParams): ZapConfig {
    if (!ZapConfig.instance) {
      ZapConfig.instance = new ZapConfig(params);
    }
    return ZapConfig.instance;
  }

  /**
   * Resets the singleton instance to null, allowing for re-initialization.
   */
  public static resetInstance(): void {
    ZapConfig.instance = null;
  }

  /**
   * Retrieves the Hyperbolic API key from the configuration.
   *
   * @returns The Hyperbolic API key string
   * @throws Error if the API key is not found
   */
  public getHyperbolicApiKey(): string {
    const apiKey = this.config.hyperbolicApiKey;
    if (!apiKey) {
      throw new Error(
        "Hyperbolic API key not found. Please provide it via constructor or set HYPERBOLIC_API_KEY environment variable.",
      );
    }
    return apiKey;
  }

  /**
   * Retrieves the Google token from the configuration.
   *
   * @returns The Google token string
   * @throws Error if the token is not found
   */
  public getGoogleToken(): string {
    const token = this.config.googleToken;
    if (!token) {
      throw new Error(
        "Google token not found. Please provide it via constructor or set GOOGLE_TOKEN environment variable.",
      );
    }
    return token;
  }

  /**
   * Retrieves the EVM API key from the configuration.
   *
   * @returns The EVM API key string
   * @throws Error if the API key is not found
   */
  public getEvmApiKey(): string {
    const apiKey = this.config.evmApiKey;
    if (!apiKey) {
      throw new Error(
        "EVM API key not found. Please provide it via constructor or set EVM_API_KEY environment variable.",
      );
    }
    return apiKey;
  }

  /**
   * Retrieves the Telegram API key from the configuration.
   *
   * @returns The Telegram API key string
   * @throws Error if the API key is not found
   */
  public getTelegramApiKey(): string {
    const apiKey = this.config.telegramApiKey;
    if (!apiKey) {
      throw new Error(
        "Telegram API key not found. Please provide it via constructor or set TELEGRAM_API_KEY environment variable.",
      );
    }
    return apiKey;
  }

  /**
   * Retrieves the Twitter API key from the configuration.
   *
   * @returns The Twitter API key string
   * @throws Error if the API key is not found
   */
  public getTwitterApiKey(): string {
    const apiKey = this.config.twitterApiKey;
    if (!apiKey) {
      throw new Error(
        "Twitter API key not found. Please provide it via constructor or set TWITTER_API_KEY environment variable.",
      );
    }
    return apiKey;
  }
}

// Export a singleton instance
export const zapConfig = ZapConfig.getInstance();
