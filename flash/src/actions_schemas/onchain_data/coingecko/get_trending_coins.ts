import { z } from "zod";

export const GET_TRENDING_COINS_ACTION_NAME = "get_trending_coins";

/**
 * Step 1: Define Input Schema
 * 
 * Schema for the CoinGecko trending coins tool inputs
 * This endpoint doesn't require any parameters
 */
export const TrendingCoinsSchema = z.object({}).strict();

/**
 * Step 2: Create Tool Prompt
 * 
 * Documentation for the AI on how to use this tool
 */
export const TRENDING_COINS_PROMPT = `
This tool fetches the top-7 trending coins on CoinGecko as searched by users in the last 24 hours.

No inputs required.

Example:
- Basic usage: {}

Important notes:
- This endpoint is available on the free CoinGecko API plan
- Rate limits apply (10-50 calls/minute depending on usage)
- Results are updated every 24 hours
- Trending coins are based on user search volume
`;

