// get_available_gpus_test.ts
import { ZapConfig } from "../config/zap_config";
import { HyperbolicConfig } from "../actions/hyperbolic/config/hyperbolic_config";
import { getAvailableGpus } from "../actions/hyperbolic/get_available_gpus";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 *
 */
class GetAvailableGpusTest {
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
    // Reset modules and environment before each test
    jest.resetModules();
    process.env = { ...this.OLD_ENV };

    // Reset singleton instances
    ZapConfig.resetInstance();
    HyperbolicConfig.resetInstance();

    // Set up required environment variables
    process.env.HYPERBOLIC_API_KEY = "test-api-key";

    // Initialize configs with test values if needed
    ZapConfig.getInstance({
      hyperbolicApiKey: "test-api-key",
    });

    // Initialize HyperbolicConfig after ZapConfig
    HyperbolicConfig.getInstance({
      apiKey: "test-api-key",
    });
  }

  /**
   *
   */
  afterEach() {
    // Clean up after each test
    jest.clearAllMocks();
  }

  /**
   *
   */
  async testFetchGpuInformation() {
    // Your test implementation
    const mockResponse = {
      data: {
        instances: [
          {
            id: "test-node",
            status: "ready",
            // ... rest of your mock data
          },
        ],
      },
    };

    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    const result = await getAvailableGpus();
    expect(result).toBeDefined();
    // Add your specific assertions here
  }

  // ... other test methods
}

describe("Get Available GPUs", () => {
  const testInstance = new GetAvailableGpusTest();

  beforeEach(() => testInstance.beforeEach());
  afterEach(() => testInstance.afterEach());

  it("should successfully fetch GPU information", async () => {
    await testInstance.testFetchGpuInformation();
  });

  it("should handle missing API key correctly", async () => {
    // Reset the configs and clear environment
    ZapConfig.resetInstance();
    HyperbolicConfig.resetInstance();
    delete process.env.HYPERBOLIC_API_KEY;

    await expect(getAvailableGpus()).rejects.toThrow("Hyperbolic API key not found");
  });
});
