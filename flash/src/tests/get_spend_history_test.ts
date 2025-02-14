import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import axios from "axios";
import { getSpendHistory } from "../actions/hyperbolic/get_spend_history";
import { ZapConfig } from "../config/zap_config";
import { HyperbolicConfig } from "../actions/hyperbolic/config/hyperbolic_config";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 *
 */
class GetSpendHistoryTest {
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
  async testFetchAndFormatSpendHistory() {
    // Mock successful API response
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        instance_history: [
          {
            instance_name: "test-instance",
            instance_id: "test-id",
            started_at: "2024-01-01T00:00:00Z",
            terminated_at: "2024-01-01T01:00:00Z",
            price: {
              amount: 100, // $1.00 per hour
              currency: "USD",
            },
            gpu_count: 1,
            hardware: {
              gpus: [
                {
                  model: "NVIDIA-A100",
                  ram: 80,
                },
              ],
            },
          },
        ],
      },
    });

    const result = await getSpendHistory();
    expect(result).toContain("GPU Rental Spending Analysis");
    expect(result).toContain("A100");
    expect(result).toContain("Total Spending: $1.00");
  }

  /**
   *
   */
  async testHandleEmptyHistory() {
    // Mock API response with empty history
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        instance_history: [],
      },
    });

    const result = await getSpendHistory();
    expect(result).toBe("No rental history found.");
  }

  /**
   *
   */
  async testThrowErrorWhenAPIKeyIsMissing() {
    // Remove API key from environment
    delete process.env.HYPERBOLIC_API_KEY;

    await expect(getSpendHistory()).rejects.toThrow("Failed to fetch spend history");
  }

  /**
   *
   */
  async testHandleAPIErrors() {
    // Mock API error
    mockedAxios.get.mockRejectedValueOnce(new Error("API Error"));

    await expect(getSpendHistory()).rejects.toThrow("Failed to fetch spend history");
  }
}

describe("Get Spend History", () => {
  const testInstance = new GetSpendHistoryTest();

  beforeEach(() => testInstance.beforeEach());
  afterEach(() => testInstance.afterEach());

  it("should successfully fetch and format spend history", async () => {
    await testInstance.testFetchAndFormatSpendHistory();
  });

  it("should handle empty history", async () => {
    await testInstance.testHandleEmptyHistory();
  });

  it("should throw error when API key is missing", async () => {
    await testInstance.testThrowErrorWhenAPIKeyIsMissing();
  });

  it("should handle API errors appropriately", async () => {
    await testInstance.testHandleAPIErrors();
  });
});
