import { z } from "zod";

export const GET_HISTORICAL_TOKEN_PRICES_ACTION_NAME = "get_historical_token_prices";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the Alchemy historical token price tool inputs
 */
export const HistoricalTokenPriceSchema = z.object({
    network: z.enum(["ETH_MAINNET", "ETH_SEPOLIA", "MATIC_MAINNET", "OPT_MAINNET", "ARB_MAINNET", "BASE_MAINNET"]).describe("Network name (e.g., 'ETH_MAINNET')"),
    address: z.string().describe("Token contract address"),
    startTime: z.string().describe("Start time in ISO format (e.g., '2024-01-01T00:00:00Z')"),
    endTime: z.string().describe("End time in ISO format (e.g., '2024-01-31T23:59:59Z')"),
    interval: z.enum(["5m", "1h", "1d"]).describe("Time interval between data points"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Documentation for the AI on how to use this tool
   */
export const HISTORICAL_TOKEN_PRICE_PROMPT = `
  This tool fetches historical cryptocurrency prices using the Alchemy Price API.
  
  Required inputs:
  - network: Network name (e.g., 'ETH_MAINNET')
  - address: Token contract address
  - startTime: Start time in ISO format (e.g., '2024-01-01T00:00:00Z')
  - endTime: End time in ISO format (e.g., '2024-01-31T23:59:59Z')
  - interval: Time interval between data points:
    - "5m": 5-minute intervals
    - "1h": Hourly data
    - "1d": Daily data
  
  Optional inputs:
  - currency: Currency to convert to (default: 'USD')
  
  Examples:
  - Daily prices for January 2024: {
      "network": "ETH_MAINNET",
      "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "startTime": "2024-01-01T00:00:00Z",
      "endTime": "2024-01-31T23:59:59Z",
      "interval": "1d"
    }
  - Hourly prices for a specific day: {
      "network": "ETH_MAINNET",
      "address": "0x15b7c0c907e4C6b9AdaAaabC300C08991D6CEA05",
      "startTime": "2024-01-15T00:00:00Z",
      "endTime": "2024-01-15T23:59:59Z",
      "interval": "1h"
    }
  
  Important notes:
  - Requires a valid Alchemy API key
  - Token symbols are case-sensitive
  - Time range should not be too large for small intervals to avoid large response sizes
  - Dates must be in ISO format with timezone (e.g., 'Z' for UTC)
  `;