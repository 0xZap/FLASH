import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../zap_action";
import { HyperbolicConfig } from "./config/hyperbolic_config";

// Schema for GPU instance response data
const GpuInstanceSchema = z.object({
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
const GetGpuStatusSchema = z.object({}).strict();

const GET_GPU_STATUS_PROMPT = `
This tool will get the status of all your currently rented GPU instances on the Hyperbolic platform.

It does not take any inputs

Important notes:
- Authorization key is required for this operation
- The GPU prices are in CENTS per hour
- Provides SSH access commands for each instance
- Shows hardware specifications and current status
`;

/**
 * Get status of rented GPU instances from Hyperbolic platform.
 * @returns Formatted string of GPU instance statuses.
 */
export async function getGpuStatus() {
    const config = HyperbolicConfig.getInstance();
    const apiKey = config.getApiKey();

    if (!apiKey) {
        throw new Error("Hyperbolic API key not found");
    }

  try {
    const response = await axios.get("https://api.hyperbolic.xyz/v1/marketplace/instances", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    // Ensure instances is always an array, even if response.data.instances is undefined
    const instances = Array.isArray(response.data.instances) ? response.data.instances : [];
    if (instances.length === 0) {
      return "No active GPU instances found.";
    }

    // Format response
    const formattedResponse = instances
      .map(instance => {
        // Safely access nested properties with optional chaining and nullish coalescing
        const gpu = instance.hardware?.gpus?.[0] ?? {};
        const gpuModel = gpu.model?.replace("NVIDIA-", "") ?? "Unknown";
        const memory = gpu.ram ? Math.round(gpu.ram / 1024) : "Unknown";
        const price = instance.pricing?.price?.amount
          ? `$${(instance.pricing.price.amount / 100).toFixed(2)}`
          : "Unknown";
        const storageGB = instance.hardware?.storage?.[0]?.capacity
          ? Math.round(instance.hardware.storage[0].capacity / 1024)
          : "Unknown";
        const ramGB = instance.hardware?.ram?.[0]?.capacity
          ? Math.round(instance.hardware.ram[0].capacity / 1024)
          : "Unknown";
        const cpuCores = instance.hardware?.cpus?.[0]?.virtual_cores ?? "Unknown";
        const gpuClock = gpu.clock_speed ?? "Unknown";
        const computePower = gpu.compute_power ?? "Unknown";

        // Handle different status states
        const status = instance.status ?? "Unknown";
        let statusInfo = `Status: ${status}`;
        if (status.toLowerCase() !== "ready") {
          statusInfo += ` (Instance not ready for use)`;
        }

        return `Instance ID: ${instance.id || "Unknown"}
- ${statusInfo}
- GPU: ${gpuModel}${memory !== "Unknown" ? ` (${memory}GB)` : ""}
- Price: ${price}/hour
${instance.ssh_command ? `- SSH Access: ${instance.ssh_command}` : "- SSH Access: Not available"}
- Hardware Specs:
  • CPU: ${cpuCores}${typeof cpuCores === "number" ? " virtual cores" : ""}
  • RAM: ${ramGB}${typeof ramGB === "number" ? "GB" : ""}
  • Storage: ${storageGB}${typeof storageGB === "number" ? "GB" : ""}
  • GPU Clock: ${gpuClock}${typeof gpuClock === "number" ? "MHz" : ""}
  • Compute Power: ${computePower}${typeof computePower === "number" ? " TFLOPS" : ""}
- Start Time: ${instance.start_time ? new Date(instance.start_time).toLocaleString() : "Not started"}`;
      })
      .join("\n\n");

    return formattedResponse;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch GPU status: ${error.message}`);
    }
    throw new Error("Failed to fetch GPU status");
  }
}

/**
 * Action to get GPU instance status from Hyperbolic platform.
 */
export class getGpuStatusAction implements ZapAction<typeof GetGpuStatusSchema> {
  public name = "get_gpu_status";
  public description = GET_GPU_STATUS_PROMPT;
  public schema = GetGpuStatusSchema;
  public func = getGpuStatus;
}
