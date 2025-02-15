import { ZapConfig } from "./zap_config";

export interface EthereumConfigParams {
  privateKey?: string;
}

/**
 * Configuration class for Ethereum integration.
 */
export class EthereumConfig {
  private static instance: EthereumConfig | null = null;
  private readonly privateKey: string;

  /**
   * Creates a new EthereumConfig instance.
   *
   * @param params - Optional configuration parameters for Ethereum
   */
  private constructor(params?: EthereumConfigParams) {
    try {
      // First try to get private key from params
      if (params?.privateKey) {
        this.privateKey = params.privateKey;
        return;
      }

      // Then try to get from ZapConfig
      const zapConfig = ZapConfig.getInstance();
      if (!zapConfig) {
        throw new Error("ZapConfig not initialized");
      }
      this.privateKey = zapConfig.getEthereumPrivateKey();
    } catch (error) {
      throw new Error(
        "Failed to initialize EthereumConfig: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  }

  /**
   * Gets the singleton instance of EthereumConfig.
   *
   * @param params - Optional configuration parameters for Ethereum
   * @returns The EthereumConfig instance
   */
  public static getInstance(params?: EthereumConfigParams): EthereumConfig {
    if (!EthereumConfig.instance) {
      EthereumConfig.instance = new EthereumConfig(params);
    }
    return EthereumConfig.instance;
  }

  /**
   * Resets the singleton instance of EthereumConfig.
   */
  public static resetInstance(): void {
    EthereumConfig.instance = null;
  }

  /**
   * Gets the Ethereum private key.
   *
   * @returns The Ethereum private key string
   */
  public getPrivateKey(): string {
    if (!this.privateKey) {
      throw new Error(
        "Ethereum private key not found. Please provide it via constructor or set ETHEREUM_PRIVATE_KEY environment variable.",
      );
    }
    return this.privateKey;
  }
}
