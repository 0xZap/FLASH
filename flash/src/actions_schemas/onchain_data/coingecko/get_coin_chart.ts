import { z } from "zod";

export const GET_COIN_CHART_ACTION_NAME = "get_coin_chart";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the input parameters of the tool
 */
export const CoinChartSchema = z.object({
    id: z.string().describe("The ID of the coin to fetch chart data for (e.g., 'bitcoin', 'ethereum')"),
    vs_currency: z.string().default("usd").describe("The target currency (e.g., 'usd', 'eur', 'btc')"),
    days: z.enum(["1", "7", "14", "30", "90", "180", "365", "max"]).default("30")
      .describe("Data up to number of days ago (1/7/14/30/90/180/365/max)"),
    interval: z.enum(["daily", "hourly"]).optional()
      .describe("Data interval. Possible values: daily, hourly (default: auto based on days)"),
  }).strict();
  
  /**
   * Step 2: Create Tool Prompt
   * 
   * Description of what the tool does and how to use it
   */
  export const COIN_CHART_PROMPT = `
  Get historical chart data for a specific cryptocurrency by its ID.
  
  This tool fetches price, market cap, and volume data over time for a cryptocurrency, suitable for charting.
  The data is summarized in a text format with key statistics and trends.
  
  Example usage:
  - Get Bitcoin 30-day chart data in USD: \`{ "id": "bitcoin", "days": "30" }\`
  - Get Ethereum 7-day chart data in EUR: \`{ "id": "ethereum", "vs_currency": "eur", "days": "7" }\`
  - Get 1-year chart data with daily intervals: \`{ "id": "solana", "days": "365", "interval": "daily" }\`
  `;
  