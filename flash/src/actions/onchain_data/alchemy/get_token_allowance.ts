import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { Alchemy, Network } from "alchemy-sdk";
import { AlchemyConfig } from "../../../config/alchemy_config";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy token allowance tool inputs
 */
const TokenAllowanceSchema = z.object({
  contract: z.string().describe("The token contract address"),
  owner: z.string().describe("The address of the token owner"),
  spender: z.string().describe("The address of the spender (contract or wallet authorized to spend tokens)"),
  network: z.string().default("ETH_MAINNET").describe("The network to query (e.g., 'ETH_MAINNET', 'MATIC_MAINNET')"),
}).strict();

/**
 * Step 2: Create Tool Prompt
 * 
 * Documentation for the AI on how to use this tool
 */
const TOKEN_ALLOWANCE_PROMPT = `
This tool fetches token allowance information using the Alchemy API.

Required inputs:
- contract: The token contract address
- owner: The address of the token owner
- spender: The address of the spender (contract or wallet authorized to spend tokens)

Optional inputs:
- network: The network to query (default: "ETH_MAINNET")
  Other options: MATIC_MAINNET, MATIC_MUMBAI, ASTAR_MAINNET, etc.

Examples:
- Basic usage: {
    "contract": "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
    "owner": "0xf1a726210550c306a9964b251cbcd3fa5ecb275d",
    "spender": "0xdef1c0ded9bec7f1a1670819833240f027b25eff"
  }
- On Ethereum: {
    "contract": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    "owner": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    "spender": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
  }

Important notes:
- Requires a valid Alchemy API key
- Used to check how many tokens a spender is allowed to transfer on behalf of the owner
- Critical for understanding approval relationships for smart contract interactions
`;

/**
 * Maps network string to Alchemy Network enum
 * @param networkString Network string (e.g., "ETH_MAINNET")
 * @returns Alchemy Network enum value
 */
function getNetworkFromString(networkString: string): Network {
  const networkMap: {[key: string]: Network} = {
    "ETH_MAINNET": Network.ETH_MAINNET,
    "ETH_GOERLI": Network.ETH_GOERLI,
    "ETH_SEPOLIA": Network.ETH_SEPOLIA,
    "MATIC_MAINNET": Network.MATIC_MAINNET,
    "MATIC_MUMBAI": Network.MATIC_MUMBAI,
    "ASTAR_MAINNET": Network.ASTAR_MAINNET,
    "OPT_MAINNET": Network.OPT_MAINNET,
    "OPT_GOERLI": Network.OPT_GOERLI,
    "ARB_MAINNET": Network.ARB_MAINNET,
    "ARB_GOERLI": Network.ARB_GOERLI,
  };
  
  return networkMap[networkString] || Network.ETH_MAINNET;
}

/**
 * Step 3: Implement Tool Function
 * 
 * Function that fetches token allowance information from Alchemy
 * @param inputs The contract, owner, spender addresses and network
 * @returns Formatted token allowance information
 */
export async function getTokenAllowance(inputs: z.infer<typeof TokenAllowanceSchema>): Promise<string> {
  // Get API key from configuration
  const config = AlchemyConfig.getInstance();
  const apiKey = config.getApiKey();
  
  if (!apiKey) {
    throw new Error("Alchemy API key not found. Please set it in your configuration.");
  }
  
  try {
    // Convert network string to Alchemy Network enum
    const network = getNetworkFromString(inputs.network);
    
    // Initialize Alchemy client with the specified network
    const alchemy = new Alchemy({ 
      apiKey,
      network 
    });
    
    // Parameters for the allowance request
    const params = {
      contract: inputs.contract,
      owner: inputs.owner,
      spender: inputs.spender
    };
    
    // Fetch token allowance using the Alchemy API
    const allowanceResponse = await alchemy.core.send("alchemy_getTokenAllowance", [params]);
    
    // Convert the result to a bigint for proper handling of large numbers
    const allowance = BigInt(allowanceResponse);
    
    // Try to get token metadata to format the response better
    let formattedResponse = "";
    try {
      const metadata = await alchemy.core.getTokenMetadata(inputs.contract);
      
      // Calculate allowance in token units if decimals are available
      if (metadata.decimals !== undefined) {
        const decimals = metadata.decimals;
        const tokenName = metadata.name || "Token";
        const tokenSymbol = metadata.symbol || "";
        
        // Format allowance as a readable number with proper decimals
        const readableAllowance = formatBigIntWithDecimals(allowance, decimals || 18);
        
        formattedResponse = `Token Allowance:\n\n`;
        formattedResponse += `Token: ${tokenName} (${tokenSymbol})\n`;
        formattedResponse += `Contract: ${inputs.contract}\n`;
        formattedResponse += `Owner: ${inputs.owner}\n`;
        formattedResponse += `Spender: ${inputs.spender}\n`;
        formattedResponse += `Network: ${inputs.network}\n\n`;
        
        // Check if allowance is effectively infinite
        if (allowance > BigInt(2) ** BigInt(128)) {
          formattedResponse += `Allowance: Unlimited (${readableAllowance} ${tokenSymbol})\n`;
          formattedResponse += `Note: This appears to be an unlimited approval.\n`;
        } else {
          formattedResponse += `Allowance: ${readableAllowance} ${tokenSymbol}\n`;
        }
        
        // Add raw value for reference
        formattedResponse += `Raw Value: ${allowance.toString()}\n`;
      } else {
        // Fallback if decimals aren't available
        formattedResponse = `Token Allowance for ${inputs.contract} on ${inputs.network}:\n\n`;
        formattedResponse += `Owner: ${inputs.owner}\n`;
        formattedResponse += `Spender: ${inputs.spender}\n`;
        formattedResponse += `Allowance (raw): ${allowance.toString()}\n`;
      }
    } catch (error) {
      // Fallback if metadata fetch fails
      formattedResponse = `Token Allowance for ${inputs.contract} on ${inputs.network}:\n\n`;
      formattedResponse += `Owner: ${inputs.owner}\n`;
      formattedResponse += `Spender: ${inputs.spender}\n`;
      formattedResponse += `Allowance (raw): ${allowance.toString()}\n`;
    }
    
    return formattedResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Alchemy token allowance fetch failed: ${error.message}`);
    }
    throw new Error("Alchemy token allowance fetch failed with an unknown error");
  }
}

/**
 * Helper function to format bigint values with decimals
 * @param value The bigint value to format
 * @param decimals The number of decimals to use
 * @returns Formatted string with appropriate decimals
 */
function formatBigIntWithDecimals(value: bigint, decimals: number): string {
  if (value === BigInt(0)) return "0";
  
  const divisor = BigInt(10) ** BigInt(decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;
  
  // Convert fractional part to string with leading zeros
  let fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  
  // Trim trailing zeros
  fractionalStr = fractionalStr.replace(/0+$/, "");
  
  if (fractionalStr === "") {
    return integerPart.toString();
  }
  
  return `${integerPart}.${fractionalStr}`;
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetTokenAllowanceAction implements ZapAction<typeof TokenAllowanceSchema> {
  public name = "get_token_allowance";
  public description = TOKEN_ALLOWANCE_PROMPT;
  public schema = TokenAllowanceSchema;
  public config = AlchemyConfig.getInstance();
  public func = (args: { [key: string]: any }) => 
    getTokenAllowance({
      contract: args.contract,
      owner: args.owner,
      spender: args.spender,
      network: args.network,
    });
}

// Export types for testing
export type TokenAllowanceRequest = z.infer<typeof TokenAllowanceSchema>; 