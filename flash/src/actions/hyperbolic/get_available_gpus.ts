import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../zap_action";
import { HyperbolicConfig } from "./config/hyperbolic_config";

// Schema for GPU response data
const GpuSchema = z.object({
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

// Input schema (empty as no inputs required)
const GetAvailableGpusSchema = z.object({}).strict();

const GET_AVAILABLE_GPUS_PROMPT = `
This tool will get all the available GPU machines on the Hyperbolic platform.

It does not take any following inputs

Important notes:
- Authorization key is required for this operation
- The GPU prices are in CENTS per hour
`;

/**
 * Get available GPUs from Hyperbolic platform.
 * @returns Formatted string of available GPUs.
 */
export async function getAvailableGpus() {
  const config = HyperbolicConfig.getInstance();
  const apiKey = config.getApiKey();

  // Check if API key is found
  if (!apiKey) {
    throw new Error("Hyperbolic API key not found");
  }

  try {
    const response = await axios.post(
      "https://api.hyperbolic.xyz/v1/marketplace",
      { filters: {} },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    // Process GPU information
    const gpuMap = new Map<string, z.infer<typeof GpuSchema>>();

    for (const instance of response.data.instances) {
      if (instance.status === "node_ready") {
        const gpu = instance.hardware.gpus[0];
        const gpuModel = gpu.model.replace("NVIDIA-", "");
        const memory = Math.round(gpu.ram / 1024);
        const price = instance.pricing.price.amount / 100;
        const available = instance.gpus_total - instance.gpus_reserved;
        const total = instance.gpus_total;

        const key = `${gpuModel}-${price}-${instance.cluster_name}`;

        if (!gpuMap.has(key)) {
          gpuMap.set(key, {
            model: gpuModel,
            memory,
            price,
            available,
            total,
            location: instance.location.region,
            node_id: instance.id,
            cluster_name: instance.cluster_name,
            compute_power: gpu.compute_power || 0,
            clock_speed: gpu.clock_speed || 0,
            storage_capacity: instance.hardware.storage[0]?.capacity || 0,
            ram_capacity: instance.hardware.ram[0]?.capacity || 0,
            cpu_cores: instance.hardware.cpus[0]?.virtual_cores || 0,
            status: instance.status,
          });
        } else {
          const existing = gpuMap.get(key);
          if (existing) {
            existing.available += available;
            existing.total += total;
          }
        }
      }
    }

    const gpus = Array.from(gpuMap.values());
    gpus.sort((a, b) => b.price - a.price || b.available - a.available);

    // Format response
    const formattedResponse = gpus
      .map(gpu => {
        const monthlyPrice = Math.round(gpu.price * 24 * 30);
        const storageGB = Math.round(gpu.storage_capacity / 1024);
        const ramGB = Math.round(gpu.ram_capacity / 1024);

        return `${gpu.model} (${gpu.memory}GB):
- Price: $${gpu.price.toFixed(2)}/hour ($${monthlyPrice}/month)
- Available: ${gpu.available}/${gpu.total} units
- Location: ${gpu.location}
- Node ID: ${gpu.node_id}
- Cluster: ${gpu.cluster_name}
- Hardware Specs:
  • CPU: ${gpu.cpu_cores} virtual cores
  • RAM: ${ramGB}GB
  • Storage: ${storageGB}GB
  • GPU Clock: ${gpu.clock_speed}MHz
  • Compute Power: ${gpu.compute_power} TFLOPS
- Status: ${gpu.status}`;
      })
      .join("\n\n");

    return formattedResponse;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch GPU data: ${error.message}`);
    }
    throw new Error("Failed to fetch GPU data");
  }
}

/**
 * Action to get available GPUs from Hyperbolic platform.
 */
export class getAvailableGpusAction implements ZapAction<typeof GetAvailableGpusSchema> {
  public name = "get_available_gpus";
  public description = GET_AVAILABLE_GPUS_PROMPT;
  public schema = GetAvailableGpusSchema;
  public config = HyperbolicConfig.getInstance();
  public func = getAvailableGpus;
}
