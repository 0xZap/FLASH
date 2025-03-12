import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../zap_action";
import { HyperbolicConfig } from "../../config/hyperbolic_config";
import { RentComputeSchema, RENT_COMPUTE_PROMPT, RENT_COMPUTE_ACTION_NAME } from "../../actions_schemas/hyperbolic/rent_compute";

/**
 * Rent GPU compute from Hyperbolic platform.
 * @param params Rental parameters including cluster name, node ID, and GPU count
 * @returns Formatted string with rental confirmation details
 */
export async function rentCompute(params: z.infer<typeof RentComputeSchema>) {
  const config = HyperbolicConfig.getInstance();
  const apiKey = config.getApiKey();

  if (!apiKey) {
    throw new Error("Hyperbolic API key not found");
  }
  console.log("Renting compute with params:", params);
  try {
    const response = await axios.post(
      "https://api.hyperbolic.xyz/v1/marketplace/instances/create",
      {
        cluster_name: params.cluster_name,
        node_name: params.node_id,
        gpu_count: params.gpu_count,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    // Format response

    const formattedResponse = `Successfully requested GPU instance:
- Node: ${params.node_id}
- Cluster: ${params.cluster_name}
- GPU Count: ${params.gpu_count}

Your instance is being provisioned. You can check its status using the GetGPUStatus command.`;

    return formattedResponse;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to rent compute: ${errorMessage}`);
    }
    throw error instanceof Error
      ? new Error(`Failed to rent compute: ${error.message}`)
      : new Error("Failed to rent compute");
  }
}

/**
 * Action to rent GPU compute from Hyperbolic platform.
 */
export class RentComputeAction implements ZapAction<typeof RentComputeSchema> {
  public name = RENT_COMPUTE_ACTION_NAME;
  public description = RENT_COMPUTE_PROMPT;
  public schema = RentComputeSchema;
  public func = (args: { [key: string]: any }) => 
    rentCompute({
      node_id: args.node_id,
      cluster_name: args.cluster_name,
      gpu_count: args.gpu_count
    });
}
