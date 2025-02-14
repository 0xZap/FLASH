import axios from "axios";
import { rentCompute } from "../actions/hyperbolic/rent_compute";
import { ZapConfig } from "../config/zap_config";
import { HyperbolicConfig } from "../actions/hyperbolic/config/hyperbolic_config";

// Mock response data
const MOCK_RENT_RESPONSE = {
  instance: {
    id: "instance-123",
    status: "provisioning",
    node_name: "node-a1",
    cluster_name: "cluster-1",
    gpu_count: 2,
  },
};

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 *
 */
class RentComputeTest {
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
    jest.resetModules();
    process.env = { ...this.OLD_ENV };
    process.env.HYPERBOLIC_API_KEY = "test-api-key";
    ZapConfig.resetInstance();
    HyperbolicConfig.resetInstance();
    ZapConfig.getInstance({ hyperbolicApiKey: "test-api-key" });
    HyperbolicConfig.getInstance({ apiKey: "test-api-key" });
  }

  /**
   *
   */
  afterEach() {
    process.env = this.OLD_ENV;
    jest.clearAllMocks();
  }

  /**
   *
   */
  async testRentGpuCompute() {
    mockedAxios.post.mockResolvedValueOnce({ data: MOCK_RENT_RESPONSE });

    const params = {
      cluster_name: "cluster-1",
      node_id: "node-a1",
      gpu_count: 2,
    };

    const result = await rentCompute(params);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "https://api.hyperbolic.xyz/v1/marketplace/instances/create",
      {
        cluster_name: "cluster-1",
        node_name: "node-a1",
        gpu_count: 2,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-api-key",
        },
      },
    );

    // Verify the formatted output contains expected information
    expect(result).toContain("Instance ID: instance-123");
    expect(result).toContain("Node: node-a1");
    expect(result).toContain("Cluster: cluster-1");
    expect(result).toContain("GPU Count: 2");
    expect(result).toContain("Status: provisioning");
    expect(result).toContain("You can check its status using the GetGPUStatus command");
  }
}

describe("Rent Compute", () => {
  const testInstance = new RentComputeTest();

  beforeEach(() => testInstance.beforeEach());
  afterEach(() => testInstance.afterEach());

  it("should successfully rent GPU compute and format response", async () => {
    await testInstance.testRentGpuCompute();
  });

  it("should throw error when API key is missing", async () => {
    delete process.env.HYPERBOLIC_API_KEY;

    const params = {
      cluster_name: "cluster-1",
      node_id: "node-a1",
      gpu_count: 2,
    };

    await expect(rentCompute(params)).rejects.toThrow("Failed to rent compute");
  });

  it("should handle API errors appropriately", async () => {
    const error = new Error("API Error");
    mockedAxios.post.mockRejectedValueOnce(error);

    const params = {
      cluster_name: "cluster-1",
      node_id: "node-a1",
      gpu_count: 2,
    };

    await expect(rentCompute(params)).rejects.toThrow("Failed to rent compute");
  });

  it("should handle Axios errors with specific error message", async () => {
    const axiosError = {
      message: "Request failed with status code 400",
      isAxiosError: true,
    };
    mockedAxios.post.mockRejectedValueOnce(axiosError);

    const params = {
      cluster_name: "cluster-1",
      node_id: "node-a1",
      gpu_count: 2,
    };

    await expect(rentCompute(params)).rejects.toThrow("Failed to rent compute");
  });

  it("should validate input parameters", async () => {
    const invalidParams = {
      cluster_name: "cluster-1",
      node_id: "node-a1",
      gpu_count: 0, // Invalid: minimum is 1
    };

    // Note: This test relies on Zod's runtime validation
    await expect(rentCompute(invalidParams)).rejects.toThrow();
  });
});
