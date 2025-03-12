import { z } from "zod";

export const GET_COIN_HISTORY_ACTION_NAME = "get_coin_history";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the input parameters of the tool
 */
export const CoinHistorySchema = z.object({
    id: z.string().describe("The ID of the coin to fetch historical data for (e.g., 'bitcoin', 'ethereum')"),
    date: z.string().describe("The date in DD-MM-YYYY format (e.g., '30-12-2020')"),
    localization: z.boolean().optional().describe("Include localized data (default: false)"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Description of what the tool does and how to use it
   */
export const COIN_HISTORY_PROMPT = `
  Get historical data for a specific cryptocurrency by its ID on a specific date.
  
  This tool fetches snapshot data for a cryptocurrency at a specific point in time, including:
  - Price
  - Market cap
  - Volume
  - Community data
  - Developer data
  
  Example usage:
  - Get Bitcoin data from December 31, 2020: \`{ "id": "bitcoin", "date": "31-12-2020" }\`
  - Get Ethereum data from January 1, 2021: \`{ "id": "ethereum", "date": "01-01-2021" }\`
  `;
  