import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { Alchemy } from "alchemy-sdk";
import { AlchemyConfig } from "../../../config/alchemy_config";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy token price tool inputs
 */
const TokenPriceSchema = z.object({
  symbols: z.array(z.string()).min(1).describe("Array of token symbols to fetch prices for (e.g., ['ETH', 'BTC'])"),
  currencies: z.array(z.string()).optional().default(["USD"]).describe("Array of currencies to convert to (e.g., ['USD', 'EUR'])"),
}).strict();

/**
 * Step 2: Create Tool Prompt
 * 
 * Documentation for the AI on how to use this tool
 */
const TOKEN_PRICE_PROMPT = `
This tool fetches current cryptocurrency prices using the Alchemy Price API.

Required inputs:
- symbols: Array of token symbols to fetch prices for (e.g., ['ETH', 'BTC', 'USDT'])

Optional inputs:
- currencies: Array of currencies to convert to (default: ['USD'])

Examples:
- Basic price check: { "symbols": ["ETH", "BTC"] }
- Multi-currency check: { "symbols": ["ETH"], "currencies": ["USD", "EUR"] }

Important notes:
- Requires a valid Alchemy API key
- Token symbols are case-sensitive
- Results include the current price and last update time
`;

/**
 * Step 3: Implement Tool Function
 * 
 * Function that fetches token prices from Alchemy
 * @param inputs The token symbols and currencies
 * @returns Formatted price results
 */
export async function getTokenPrices(inputs: z.infer<typeof TokenPriceSchema>): Promise<string> {
  // Get API key from configuration
  const config = AlchemyConfig.getInstance();
  const apiKey = config.getApiKey();
  
  if (!apiKey) {
    throw new Error("Alchemy API key not found. Please set it in your configuration.");
  }
  
  try {
    // Initialize Alchemy client
    const alchemy = new Alchemy({ apiKey });
    
    // Fetch token prices by symbol
    const result = await alchemy.prices.getTokenPriceBySymbol(inputs.symbols);
    
    // Format results
    if (!result || !result.data || result.data.length === 0) {
      return "No price data found for the specified tokens.";
    }
    
    // Build formatted response
    let formattedResponse = `Current token prices:\n\n`;
    
    result.data.forEach((tokenData) => {
      formattedResponse += `${tokenData.symbol}:\n`;
      
      if (tokenData.error) {
        formattedResponse += `  Error: ${tokenData.error}\n`;
        return;
      }
      
      if (!tokenData.prices || tokenData.prices.length === 0) {
        formattedResponse += `  No price data available\n`;
        return;
      }
      
      tokenData.prices.forEach((price) => {
        formattedResponse += `  ${price.currency}: ${price.value}\n`;
        formattedResponse += `  Last Updated: ${price.lastUpdatedAt}\n`;
      });
      
      formattedResponse += "\n";
    });
    
    return formattedResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Alchemy price fetch failed: ${error.message}`);
    }
    throw new Error("Alchemy price fetch failed with an unknown error");
  }
}

/**
 * Step 4: Create Tool Action Class
 * 
 * Class that implements the ZapAction interface to register the tool
 */
export class GetTokenPricesAction implements ZapAction<typeof TokenPriceSchema> {
  public name = "get_token_prices";
  public description = TOKEN_PRICE_PROMPT;
  public schema = TokenPriceSchema;
  public config = AlchemyConfig.getInstance();
  public func = (args: { [key: string]: any }) => 
    getTokenPrices({
      symbols: args.symbols,
      currencies: args.currencies,
    });
}

// Export types for testing
export type TokenPriceRequest = z.infer<typeof TokenPriceSchema>; 