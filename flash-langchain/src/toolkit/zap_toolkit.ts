import { StructuredToolInterface, BaseToolkit as Toolkit } from "@langchain/core/tools";
import { ZAP_ACTIONS, HyperbolicConfig, GoogleConfig } from "@0xzap/flash";
import { ZapTool } from "../tools/zap_tool";

/**
 * Zap Toolkit.
 */
export class ZapToolkit extends Toolkit {
  tools: StructuredToolInterface[];
  private hyperbolicConfig?: HyperbolicConfig;
  private googleConfig?: GoogleConfig;

  /**
   * Creates a new Zap Toolkit instance
   */
  constructor(hyperbolicConfig?: HyperbolicConfig, googleConfig?: GoogleConfig) {
    super();
    this.hyperbolicConfig = hyperbolicConfig;
    this.googleConfig = googleConfig;
    this.tools = this.initializeTools();
  }

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

    const actions = ZAP_ACTIONS;
    return actions.map(action => new ZapTool(action));
  }
}