import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../zap_action";
import { HyperbolicConfig } from "./config/hyperbolic_config";

// Input schema for wallet address
const LinkWalletAddressSchema = z
  .object({
    wallet_address: z.string().describe("The wallet address to link to your Hyperbolic account"),
  })
  .strict();

const LINK_WALLET_ADDRESS_PROMPT = `
This tool will allow you to link a wallet address to your Hyperbolic account. 

It takes the following inputs:
- wallet_address: The wallet address to link to your Hyperbolic account

Important notes:        
- Authorization key is required for this operation
- After linking the wallet address, you can send USDC, USDT, or DAI on Base network to Hyperbolic address: 0xd3cB24E0Ba20865C530831C85Bd6EbC25f6f3B60
`;

/**
 * Links a wallet address to your Hyperbolic account.
 * @param wallet_address The wallet address to link
 * @returns Formatted response from the API
 */
export async function linkWalletAddress(wallet_address: string) {
  const config = HyperbolicConfig.getInstance();
  const apiKey = config.getApiKey();

  if (!apiKey) {
    throw new Error("Hyperbolic API key not found");
  }

  try {
    const response = await axios.post(
      "https://api.hyperbolic.xyz/settings/crypto-address",
      { address: wallet_address },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    return JSON.stringify(response.data, null, 2);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to link wallet address: ${error.message}`);
    }
    throw new Error("Failed to link wallet address");
  }
}

/**
 * Action to link wallet address to Hyperbolic account.
 */
export class LinkWalletAddressAction implements ZapAction<typeof LinkWalletAddressSchema> {
  public name = "link_wallet_address";
  public description = LINK_WALLET_ADDRESS_PROMPT;
  public schema = LinkWalletAddressSchema;
  public func = (args: { [key: string]: any }) => linkWalletAddress(args.wallet_address);
}
