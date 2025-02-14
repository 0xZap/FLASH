import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import axios from "axios";
import { getGpuStatus } from "../actions/hyperbolic/get_gpu_status";
import { ZapConfig } from "../config/zap_config";
import { HyperbolicConfig } from "../actions/hyperbolic/config/hyperbolic_config";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 *
 */
class GetGpuStatusTest {
  OLD_ENV: NodeJS.ProcessEnv;

  /**
   *
   */
  constructor() {
    this.OLD_ENV = process.env;
  }

  /**
   *
   */
  beforeEach() {
    // Save the current environment variables
    this.OLD_ENV = { ...process.env };
    jest.resetModules();
    process.env = { ...this.OLD_ENV };
    ZapConfig.resetInstance();
    HyperbolicConfig.resetInstance();
    process.env.HYPERBOLIC_API_KEY = "test-api-key";
    ZapConfig.getInstance({ hyperbolicApiKey: "test-api-key" });
    HyperbolicConfig.getInstance({ apiKey: "test-api-key" });
  }

  /**
   *
   */
  afterEach() {
    process.env = this.OLD_ENV;
  }

  /**
   *
   */
  async testFetchAndFormatGpuStatus() {
    // Mock successful API response
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        instances: [
          {
            id: "test-id",
            status: "ready",
            start_time: "2024-01-01T00:00:00Z",
            ssh_command: "ssh user@host",
            hardware: {
              gpus: [
                {
                  model: "NVIDIA-A100",
                  ram: 8192,
                  compute_power: 19.5,
                  clock_speed: 1400,
                },
              ],
              storage: [{ capacity: 102400 }],
              ram: [{ capacity: 32768 }],
              cpus: [{ virtual_cores: 8 }],
            },
            pricing: {
              price: {
                amount: 100, // $1.00 per hour
              },
            },
          },
        ],
      },
    });

    const result = await getGpuStatus();
    expect(result).toContain("Instance ID: test-id");
    expect(result).toContain("Status: ready");
    expect(result).toContain("GPU: A100 (8GB)");
    expect(result).toContain("Price: $1.00/hour");
  }

  /**
   *
   */
  async testHandleEmptyInstances() {
    // Mock API response with empty instances
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        instances: [],
      },
    });

    const result = await getGpuStatus();
    expect(result).toBe("No active GPU instances found.");
  }

  /**
   *
   */
  async testThrowErrorWhenAPIKeyIsMissing() {
    // Remove API key from environment
    delete process.env.HYPERBOLIC_API_KEY;

    await expect(getGpuStatus()).rejects.toThrow("Failed to fetch GPU status");
  }

  /**
   *
   */
  async testHandleAPIErrors() {
    // Mock API error
    mockedAxios.get.mockRejectedValueOnce(new Error("API Error"));

    await expect(getGpuStatus()).rejects.toThrow("Failed to fetch GPU status");
  }
}

describe("Get GPU Status", () => {
  const testInstance = new GetGpuStatusTest();

  beforeEach(() => testInstance.beforeEach());
  afterEach(() => testInstance.afterEach());

  it("should successfully fetch and format GPU status", async () => {
    await testInstance.testFetchAndFormatGpuStatus();
  });

  it("should handle empty instances", async () => {
    await testInstance.testHandleEmptyInstances();
  });

  it("should throw error when API key is missing", async () => {
    await testInstance.testThrowErrorWhenAPIKeyIsMissing();
  });

  it("should handle API errors appropriately", async () => {
    await testInstance.testHandleAPIErrors();
  });
});
