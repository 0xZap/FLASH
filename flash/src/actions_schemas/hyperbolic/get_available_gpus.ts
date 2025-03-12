import { z } from "zod";

export const GET_AVAILABLE_GPUS_ACTION_NAME = "get_available_gpus";

export const GpuSchema = z.object({
    model: z.string(),
    memory: z.number(),
    price: z.number(),
    available: z.number(),
    total: z.number(),
    location: z.string(),
    node_id: z.string(),
    cluster_name: z.string(),
    compute_power: z.number(),
    clock_speed: z.number(),
    storage_capacity: z.number(),
    ram_capacity: z.number(),
    cpu_cores: z.number(),
    status: z.string(),
  });
  
  export const GetAvailableGpusSchema = z.object({}).strict();
  
  export const GET_AVAILABLE_GPUS_PROMPT = `
  This tool will get all the available GPU machines on the Hyperbolic platform.
  
  It does not take any following inputs
  
  Important notes:
  - Authorization key is required for this operation
  - The GPU prices are in CENTS per hour
  `;

