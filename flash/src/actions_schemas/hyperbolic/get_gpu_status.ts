import { z } from "zod";

export const GET_GPU_STATUS_ACTION_NAME = "get_gpu_status";

// Schema for GPU instance response data
export const GpuInstanceSchema = z.object({
    id: z.string(),
    status: z.string(),
    start_time: z.string(),
    ssh_command: z.string(),
    hardware: z.object({
      gpus: z.array(
        z.object({
          model: z.string(),
          ram: z.number(),
          compute_power: z.number(),
          clock_speed: z.number(),
        }),
      ),
      storage: z.array(
        z.object({
          capacity: z.number(),
        }),
      ),
      ram: z.array(
        z.object({
          capacity: z.number(),
        }),
      ),
      cpus: z.array(
        z.object({
          virtual_cores: z.number(),
        }),
      ),
    }),
    pricing: z.object({
      price: z.object({
        amount: z.number(),
      }),
    }),
  });
  
  // Input schema (empty as no inputs required)
  export const GetGpuStatusSchema = z.object({}).strict();
  
  export const GET_GPU_STATUS_PROMPT = `
  This tool will get the status of all your currently rented GPU instances on the Hyperbolic platform.
  
  It does not take any inputs
  
  Important notes:
  - Authorization key is required for this operation
  - The GPU prices are in CENTS per hour
  - Provides SSH access commands for each instance
  - Shows hardware specifications and current status
  `;