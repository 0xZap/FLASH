import axios from "axios";
import { terminateCompute } from "../actions/hyperbolic/terminate_compute";
import { ZapConfig } from "../config/zap_config";
import { HyperbolicConfig } from "../actions/hyperbolic/config/hyperbolic_config";

// Mock response data
const MOCK_TERMINATE_RESPONSE = {
  status: "success",
  message: "Instance terminated successfully",
};

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 *
 */
class TerminateComputeTest {
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
  async testTerminateCompute() {
    mockedAxios.post.mockResolvedValueOnce({ data: MOCK_TERMINATE_RESPONSE });

    const result = await terminateCompute("test-instance-id");

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "https://api.hyperbolic.xyz/v1/marketplace/instances/terminate",
      { id: "test-instance-id" },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-api-key",
        },
      },
    );

    expect(result).toBe(JSON.stringify(MOCK_TERMINATE_RESPONSE, null, 2));
  }

  // ... other test methods
}

describe("Terminate Compute", () => {
  const testInstance = new TerminateComputeTest();

  beforeEach(() => testInstance.beforeEach());
  afterEach(() => testInstance.afterEach());

  it("should successfully terminate a compute instance", async () => {
    await testInstance.testTerminateCompute();
  });

  it("should throw error when instance_id is empty", async () => {
    await expect(terminateCompute("")).rejects.toThrow("instance_id is required");
  });

  it("should throw error when API key is missing", async () => {
    delete process.env.HYPERBOLIC_API_KEY;

    await expect(terminateCompute("test-instance-id")).rejects.toThrow(
      "Failed to terminate compute",
    );
  });

  it("should handle API errors appropriately", async () => {
    const errorResponse = {
      response: {
        data: {
          error: "Instance not found",
          code: "NOT_FOUND",
        },
      },
      message: "Request failed with status code 404",
    };
    mockedAxios.post.mockRejectedValueOnce(errorResponse);

    await expect(terminateCompute("invalid-instance")).rejects.toThrow(
      `Failed to terminate compute instance`,
    );
  });

  it("should handle non-Axios errors", async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error("Unknown error"));

    await expect(terminateCompute("test-instance-id")).rejects.toThrow(
      "Failed to terminate compute instance",
    );
  });
});
