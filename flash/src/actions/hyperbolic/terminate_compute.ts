import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../zap_action";
import { HyperbolicConfig } from "../../config/hyperbolic_config";
import { TerminateComputeSchema, TERMINATE_COMPUTE_PROMPT, TERMINATE_COMPUTE_ACTION_NAME } from "../../actions_schemas/hyperbolic/terminate_compute";

/**
 * Terminates a marketplace instance using the Hyperbolic API.
 * @param instance_id ID of the instance to terminate
 * @returns Formatted string representation of the API response
 */
export async function terminateCompute(instance_id: string): Promise<string> {
  if (!instance_id) {
    throw new Error("instance_id is required");
  }

  const config = HyperbolicConfig.getInstance();
  const apiKey = config.getApiKey();

  if (!apiKey) {
    throw new Error("Hyperbolic API key not found");
  }

  try {
    const response = await axios.post(
      "https://api.hyperbolic.xyz/v1/marketplace/instances/terminate",
      { id: instance_id },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    return JSON.stringify(response.data, null, 2);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      let errorMessage = `Error terminating compute instance: ${error.message}`;
      if (error.response?.data) {
        errorMessage += `\nResponse: ${JSON.stringify(error.response.data, null, 2)}`;
      }
      throw new Error(errorMessage);
    }
    throw new Error("Failed to terminate compute instance");
  }
}

/**
 * Action to terminate compute instances on the Hyperbolic platform.
 */
export class TerminateComputeAction implements ZapAction<typeof TerminateComputeSchema> {
  public name = TERMINATE_COMPUTE_ACTION_NAME;
  public description = TERMINATE_COMPUTE_PROMPT;
  public schema = TerminateComputeSchema;
  public func = (args: { [key: string]: any }) => terminateCompute(args.instance_id);
}
