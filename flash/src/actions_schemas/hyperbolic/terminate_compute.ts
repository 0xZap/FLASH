import { z } from "zod";

export const TERMINATE_COMPUTE_ACTION_NAME = "terminate_compute";

export const TerminateComputeSchema = z
  .object({
    instance_id: z.string().describe("The ID of the instance to terminate"),
  })
  .strict();

export const TERMINATE_COMPUTE_PROMPT = `
This tool allows you to terminate a GPU instance on the Hyperbolic platform.
It takes the following input:
- instance_id: The ID of the instance to terminate (e.g., "respectful-rose-pelican")

Important notes:
- The instance ID must be valid and active
- After termination, the instance will no longer be accessible
- You can get instance IDs using the GetGPUStatus Action
`;