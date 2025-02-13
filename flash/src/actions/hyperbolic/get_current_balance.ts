import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../zap_action";
import { HyperbolicConfig } from "./config/hyperbolic_config";

// Update the schemas to match the actual API responses
const BalanceSchema = z.object({
  credits: z.number(),
});

const PurchaseHistorySchema = z.object({
  purchase_history: z.array(
    z.object({
      amount: z.number(),
      timestamp: z.string(),
    }),
  ),
});

// Input schema (empty as no inputs required)
const GetCurrentBalanceSchema = z.object({}).strict();

const GET_CURRENT_BALANCE_PROMPT = `
This tool retrieves your current Hyperbolic platform credit balance.
It shows:
- Available Hyperbolic platform credits in your account (in USD)
- Recent credit purchase history

Note: This is NOT for checking cryptocurrency wallet balances (ETH/USDC).
For crypto wallet balances, please use a different command.

No input parameters required.
`;

/**
 * Get current balance from Hyperbolic platform.
 * @returns Formatted string of current balance and purchase history.
 */
export async function getCurrentBalance(httpClient = axios) {
    const config = HyperbolicConfig.getInstance();
    const apiKey = config.getApiKey();
    if (!apiKey) {
        throw new Error("Hyperbolic API key not found");
    }
    try {
    // Get current balance
    const balanceResponse = await httpClient.get(
      "https://api.hyperbolic.xyz/v1/billing/get_current_balance",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    // Get purchase history
    const historyResponse = await httpClient.get(
      "https://api.hyperbolic.xyz/v1/billing/purchase_history",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    // Parse responses with their respective schemas
    const { credits } = BalanceSchema.parse(balanceResponse.data);
    const { purchase_history: purchases } = PurchaseHistorySchema.parse(historyResponse.data);
    const balanceUsd = credits / 100;

    const output = [`Your current Hyperbolic platform balance is $${balanceUsd.toFixed(2)}.`];

    if (purchases.length > 0) {
      output.push("\nPurchase History:");
      for (const purchase of purchases) {
        const amount = purchase.amount / 100;
        const timestamp = new Date(purchase.timestamp);
        const formattedDate = timestamp.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        output.push(`- $${amount.toFixed(2)} on ${formattedDate}`);
      }
    } else {
      output.push("\nNo previous purchases found.");
    }

    return output.join("\n");
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch balance data: ${error.message}`);
    }
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid response format: ${error.message}`);
    }
    // Wrap any other errors with our standard message
    throw new Error(
      `Failed to fetch balance data: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Action to get current balance from Hyperbolic platform.
 */
export class getCurrentBalanceAction implements ZapAction<typeof GetCurrentBalanceSchema> {
  public name = "get_current_balance";
  public description = GET_CURRENT_BALANCE_PROMPT;
  public schema = GetCurrentBalanceSchema;
  public func = () => getCurrentBalance();
}
