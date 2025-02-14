import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../zap_action";
import { HyperbolicConfig } from "./config/hyperbolic_config";

// Schema for rental input
const RentComputeSchema = z
  .object({
    cluster_name: z.string().describe("The cluster name to rent from"),
    node_id: z.string().describe("The node ID to rent"),
    gpu_count: z.number().min(1).describe("Number of GPUs to rent"),
  })
  .strict();

const RENT_COMPUTE_PROMPT = `
This tool will allow you to rent a GPU machine on the Hyperbolic platform.

It takes the following inputs:
- cluster_name: Which cluster the node is on
- node_id: Which node you want to rent
- gpu_count: How many GPUs you want to rent

Important notes:
- Authorization key is required for this operation
- After renting, you can check status with GetGPUStatus, access via SSHAccess, and run commands via RemoteShell
`;

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
    const instance = response.data.instance;
    const formattedResponse = `Successfully requested GPU instance:
- Instance ID: ${instance.id}
- Node: ${params.node_id}
- Cluster: ${params.cluster_name}
- GPU Count: ${params.gpu_count}
- Status: ${instance.status}

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
  public name = "rent_compute";
  public description = RENT_COMPUTE_PROMPT;
  public schema = RentComputeSchema;
  public func = (args: { [key: string]: any }) =>
    rentCompute({
      node_id: args.node_id,
      cluster_name: args.cluster_name,
      gpu_count: args.gpu_count,
    });
}
