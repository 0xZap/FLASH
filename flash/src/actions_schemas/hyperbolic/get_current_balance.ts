import { z } from "zod";

export const GET_CURRENT_BALANCE_ACTION_NAME = "get_current_balance";

export const GetCurrentBalanceSchema = z.object({}).strict();

// Update the schemas to match the actual API responses
export const BalanceSchema = z.object({
    credits: z.number(),
  });
  
export const PurchaseHistorySchema = z.object({
    purchase_history: z.array(
      z.object({
        amount: z.number(),
        timestamp: z.string(),
      }),
    ),
  });

export const GET_CURRENT_BALANCE_PROMPT = `
This tool retrieves your current Hyperbolic platform credit balance.
It shows:
- Available Hyperbolic platform credits in your account (in USD)
- Recent credit purchase history

Note: This is NOT for checking cryptocurrency wallet balances (ETH/USDC).
For crypto wallet balances, please use a different command.

No input parameters required.
`;