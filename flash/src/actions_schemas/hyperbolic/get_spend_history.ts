import { z } from "zod";

export const GET_SPEND_HISTORY_ACTION_NAME = "get_spend_history";

// Schema for spend history response data
export const SpendHistoryEntrySchema = z.object({
    instance_name: z.string(),
    instance_id: z.string(),
    started_at: z.string(),
    terminated_at: z.string(),
    price: z.object({
      amount: z.number(),
      currency: z.string(),
    }),
    gpu_count: z.number(),
    hardware: z.object({
      gpus: z.array(
        z.object({
          model: z.string(),
          ram: z.number(),
        }),
      ),
    }),
  });
  
  // Input schema (empty as no inputs required)
  export const GetSpendHistorySchema = z.object({}).strict();
  
  export const GET_SPEND_HISTORY_PROMPT = `
  This tool retrieves and analyzes your GPU rental spending history from the Hyperbolic platform.
  It provides information about:
  - List of all instances rented
  - Duration of each rental
  - Cost per rental
  - Total spending per GPU type
  - Overall total spending
  
  No input parameters required.
  
  Important notes:
  - Authorization key is required for this operation
  - All prices are in USD
  - Durations are shown in seconds for precision
  `;

