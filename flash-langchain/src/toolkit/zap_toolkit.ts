import { StructuredToolInterface, BaseToolkit as Toolkit } from "@langchain/core/tools";
import { ZAP_ACTIONS, HyperbolicConfig, GoogleConfig, EthereumConfig, ExaConfig, AlchemyConfig } from "@0xzap/flash";
import { ZapTool } from "../tools/zap_tool";

/**
 * Zap Toolkit.
 */
export class ZapToolkit extends Toolkit {
  tools: StructuredToolInterface[];
  private hyperbolicConfig?: HyperbolicConfig;
  private googleConfig?: GoogleConfig;
  private ethereumConfig?: EthereumConfig;
  private exaConfig?: ExaConfig;
  private alchemyConfig?: AlchemyConfig;
  /**
   * Creates a new Zap Toolkit instance
   *
   * @param hyperbolicConfig - Optional configuration for Hyperbolic API
   * @param googleConfig - Optional configuration for Google API
   * @param ethereumConfig - Optional configuration for Ethereum API
   * @param exaConfig - Optional configuration for Exa API
   * @param alchemyConfig - Optional configuration for Alchemy API
   */
  constructor(
    hyperbolicConfig?: HyperbolicConfig,
    googleConfig?: GoogleConfig,
    ethereumConfig?: EthereumConfig,
    exaConfig?: ExaConfig,
    alchemyConfig?: AlchemyConfig
  ) {
    super();
    this.hyperbolicConfig = hyperbolicConfig;
    this.googleConfig = googleConfig;
    this.ethereumConfig = ethereumConfig;
    this.exaConfig = exaConfig;
    this.alchemyConfig = alchemyConfig;
    this.tools = this.initializeTools();
  }

  /**
   * Initializes the Zap tools with the provided configurations
   *
   * @returns An array of structured tool interfaces
   */
  private initializeTools(): StructuredToolInterface[] {
    // If hyperbolicConfig is provided, ensure it's set as the instance
    if (this.hyperbolicConfig) {
      HyperbolicConfig.resetInstance();
      HyperbolicConfig.getInstance({ apiKey: this.hyperbolicConfig.getApiKey() });
    }

    // If googleConfig is provided, ensure it's set as the instance
    if (this.googleConfig) {
      GoogleConfig.resetInstance();
      GoogleConfig.getInstance({ token: this.googleConfig.getToken() });
    }

    // If ethereumConfig is provided, ensure it's set as the instance
    if (this.ethereumConfig) {
      EthereumConfig.resetInstance();
      EthereumConfig.getInstance({ privateKey: this.ethereumConfig.getPrivateKey() });
    }

    // If exaConfig is provided, ensure it's set as the instance
    if (this.exaConfig) {
      ExaConfig.resetInstance();
      ExaConfig.getInstance({ apiKey: this.exaConfig.getApiKey() });
    }

    // If alchemyConfig is provided, ensure it's set as the instance
    if (this.alchemyConfig) {
      AlchemyConfig.resetInstance();
      AlchemyConfig.getInstance({ apiKey: this.alchemyConfig.getApiKey() });
    }

    const actions = ZAP_ACTIONS;
    return actions.map(action => new ZapTool(action));
  }
}
