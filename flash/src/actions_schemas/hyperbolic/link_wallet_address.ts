import { z } from "zod";

export const LINK_WALLET_ADDRESS_ACTION_NAME = "link_wallet_address";

// Input schema for wallet address
export const LinkWalletAddressSchema = z
  .object({
    wallet_address: z.string().describe("The wallet address to link to your Hyperbolic account"),
  })
  .strict();

export const LINK_WALLET_ADDRESS_PROMPT = `
This tool will allow you to link a wallet address to your Hyperbolic account. 

It takes the following inputs:
- wallet_address: The wallet address to link to your Hyperbolic account

Important notes:        
- Authorization key is required for this operation
- After linking the wallet address, you can send USDC, USDT, or DAI on Base network to Hyperbolic address: 0xd3cB24E0Ba20865C530831C85Bd6EbC25f6f3B60
`;