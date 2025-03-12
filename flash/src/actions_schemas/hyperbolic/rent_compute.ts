import { z } from "zod";

export const RENT_COMPUTE_ACTION_NAME = "rent_compute";

export const RentComputeSchema = z 
  .object({
    cluster_name: z.string().describe("The cluster name to rent from"),
    node_id: z.string().describe("The node ID to rent also known as node name"),
    gpu_count: z.number().min(1).describe("Number of GPUs to rent"),
  })
  .strict();

export const RENT_COMPUTE_PROMPT = `
This tool will allow you to rent a GPU machine on the Hyperbolic platform.

It takes the following inputs:
- cluster_name: Which cluster the node is on
- node_id: Which node you want to rent
- gpu_count: How many GPUs you want to rent

Important notes:
- Authorization key is required for this operation
- After renting, you can check status with GetGPUStatus, access via SSHAccess, and run commands via RemoteShell
`;