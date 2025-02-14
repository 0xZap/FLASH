import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../zap_action";
import { HyperbolicConfig } from "./config/hyperbolic_config";

// Schema for spend history response data
const SpendHistoryEntrySchema = z.object({
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
const GetSpendHistorySchema = z.object({}).strict();

const GET_SPEND_HISTORY_PROMPT = `
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

// Add this interface near the top with other type definitions
interface InstanceSummary {
  name: string;
  gpuModel: string;
  gpuCount: number;
  durationSeconds: number;
  cost: number;
}

/**
 * Calculate duration in seconds between two timestamps.
 * @param startTime - Start timestamp
 * @param endTime - End timestamp
 * @returns Duration in seconds
 */
function calculateDurationSeconds(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end.getTime() - start.getTime()) / 1000);
}

/**
 * Get spend history from Hyperbolic platform.
 * @param options - Optional test parameters for dependency injection
 * @returns Formatted string of spending history.
 */
export async function getSpendHistory(options?: {}) {
  const config = HyperbolicConfig.getInstance();
  const apiKey = config.getApiKey();

  if (!apiKey) {
    throw new Error("Hyperbolic API key not found");
  }

  try {
    const response = await axios.get(
      "https://api.hyperbolic.xyz/v1/marketplace/instances/history",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    const instances = z.array(SpendHistoryEntrySchema).parse(response.data.instance_history || []);
    if (instances.length === 0) {
      return "No rental history found.";
    }

    // Initialize analysis variables
    let totalCost = 0;
    const gpuStats = new Map<string, { count: number; totalCost: number; totalSeconds: number }>();
    const instancesSummary: InstanceSummary[] = [];

    // Process each instance
    for (const instance of instances) {
      const durationSeconds = calculateDurationSeconds(instance.started_at, instance.terminated_at);
      const durationHours = durationSeconds / 3600;
      const cost = (durationHours * instance.price.amount) / 100;
      totalCost += cost;

      // Get GPU model and stats
      const gpuModel = instance.hardware.gpus[0]?.model.replace("NVIDIA-", "") || "Unknown GPU";
      const gpuCount = instance.gpu_count;

      // Update GPU statistics
      if (!gpuStats.has(gpuModel)) {
        gpuStats.set(gpuModel, { count: 0, totalCost: 0, totalSeconds: 0 });
      }
      const stats = gpuStats.get(gpuModel)!;
      stats.count += gpuCount;
      stats.totalCost += cost;
      stats.totalSeconds += durationSeconds;

      // Add instance summary
      instancesSummary.push({
        name: instance.instance_name,
        gpuModel,
        gpuCount,
        durationSeconds,
        cost: Number(cost.toFixed(2)),
      });
    }

    // Format the output
    const output = ["=== GPU Rental Spending Analysis ===\n"];

    output.push("Instance Rentals:");
    for (const instance of instancesSummary) {
      output.push(`- ${instance.name}:`);
      output.push(`  GPU: ${instance.gpuModel} (Count: ${instance.gpuCount})`);
      output.push(`  Duration: ${instance.durationSeconds} seconds`);
      output.push(`  Cost: $${instance.cost.toFixed(2)}`);
    }

    output.push("\nGPU Type Statistics:");
    for (const [model, stats] of gpuStats.entries()) {
      output.push(`\n${model}:`);
      output.push(`  Total Rentals: ${stats.count}`);
      output.push(`  Total Time: ${Math.round(stats.totalSeconds)} seconds`);
      output.push(`  Total Cost: $${stats.totalCost.toFixed(2)}`);
    }

    output.push(`\nTotal Spending: $${totalCost.toFixed(2)}`);

    return output.join("\n");
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch spend history: ${error.message}`);
    }
    throw new Error("Failed to fetch spend history");
  }
}

/**
 * Action to get spend history from Hyperbolic platform.
 */
export class getSpendHistoryAction implements ZapAction<typeof GetSpendHistorySchema> {
  public name = "get_spend_history";
  public description = GET_SPEND_HISTORY_PROMPT;
  public schema = GetSpendHistorySchema;
  public func = () => getSpendHistory();
}
