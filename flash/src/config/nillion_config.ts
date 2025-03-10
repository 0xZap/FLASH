import { ZapConfig } from "./zap_config";
import * as fs from "fs/promises";
import * as path from "path";

export interface NillionConfigParams {
  configPath?: string;
  nilaiToken?: string;
}

/**
 * Configuration class for Nillion API integration.
 */
export class NillionConfig {
  private static instance: NillionConfig | null = null;
  private readonly configPath: string | null = null;
  private readonly nilaiToken: string | null = null;

  /**
   * Creates a new NillionConfig instance.
   *
   * @param params - Optional configuration parameters for Nillion
   */
  private constructor(params?: NillionConfigParams) {
    try {
      // First try to get config path from params
      if (params?.configPath) {
        this.configPath = params.configPath;
      } else {
        this.configPath = process.env.NILLION_CONFIG_PATH || null;
      }

      // Get nilAI token from params or environment
      if (params?.nilaiToken) {
        this.nilaiToken = params.nilaiToken;
      } else {
        this.nilaiToken = process.env.NILLION_NILAI_TOKEN || null;
      }
    } catch (error) {
      throw new Error(
        "Failed to initialize NillionConfig: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  }

  /**
   * Gets the singleton instance of NillionConfig.
   *
   * @param params - Optional configuration parameters for Nillion
   * @returns The NillionConfig instance
   */
  public static getInstance(params?: NillionConfigParams): NillionConfig {
    if (!NillionConfig.instance) {
      NillionConfig.instance = new NillionConfig(params);
    }
    return NillionConfig.instance;
  }

  /**
   * Resets the singleton instance of NillionConfig.
   */
  public static resetInstance(): void {
    NillionConfig.instance = null;
  }

  /**
   * Gets the configuration file path.
   *
   * @returns The configuration file path or null if not set
   */
  public getConfigPath(): string | null {
    return this.configPath;
  }

  /**
   * Gets the nilAI token.
   *
   * @returns The nilAI token or null if not set
   */
  public getNilaiToken(): string | null {
    return this.nilaiToken;
  }

  /**
   * Reads and parses the configuration file.
   *
   * @returns The parsed configuration data
   * @throws Error if the config file cannot be read or parsed
   */
  public async readConfig(): Promise<any> {
    if (!this.configPath) {
      throw new Error("Nillion configuration file path not set");
    }

    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      throw new Error(
        `Failed to read Nillion configuration file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
} 