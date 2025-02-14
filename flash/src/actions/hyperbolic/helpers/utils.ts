import { HyperbolicConfig } from "../config/hyperbolic_config";

export const getApiKey = () => {
  const apiKey = HyperbolicConfig.getInstance().getApiKey();
  if (!apiKey) {
    throw new Error("HYPERBOLIC_API_KEY not found in environment variables");
  }
  return apiKey;
};
