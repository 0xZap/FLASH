import { ZapConfig } from "./zap_config";

// hyperbolic_config.ts
export interface HyperbolicConfigParams {
    apiKey?: string;
  }
  
  export class HyperbolicConfig {
    private static instance: HyperbolicConfig | null = null;
    private readonly apiKey: string;
  
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
          (error instanceof Error ? error.message : "Unknown error")
        );
      }
    }
  
    public static getInstance(params?: HyperbolicConfigParams): HyperbolicConfig {
      if (!HyperbolicConfig.instance) {
        HyperbolicConfig.instance = new HyperbolicConfig(params);
      }
      return HyperbolicConfig.instance;
    }
  
    public static resetInstance(): void {
      HyperbolicConfig.instance = null;
    }
  
    public getApiKey(): string {
      if (!this.apiKey) {
        throw new Error("Hyperbolic API key not found. Please provide it via constructor or set HYPERBOLIC_API_KEY environment variable.");
      }
      return this.apiKey;
    }
  }