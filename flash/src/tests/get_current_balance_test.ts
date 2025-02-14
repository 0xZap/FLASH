import axios from "axios";
import { getCurrentBalance } from "../actions/hyperbolic/get_current_balance";
import { ZapConfig } from "../config/zap_config";
import { HyperbolicConfig } from "../actions/hyperbolic/config/hyperbolic_config";

// Mock response data
const MOCK_BALANCE_RESPONSE = {
  credits: 15000, // $150.00 in cents
};

const MOCK_HISTORY_RESPONSE = {
  purchase_history: [
    {
      amount: 10000, // $100.00 in cents
      timestamp: "2024-03-15T10:00:00Z",
    },
    {
      amount: 5000, // $50.00 in cents
      timestamp: "2024-03-10T15:30:00Z",
    },
  ],
};

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 *
 */
class GetCurrentBalanceTest {
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
    process.env = this.OLD_ENV;
    jest.clearAllMocks();
  }

  /**
   *
   */
  async testFetchAndFormatBalanceInformation() {
    mockedAxios.get
      .mockResolvedValueOnce({ data: MOCK_BALANCE_RESPONSE })
      .mockResolvedValueOnce({ data: MOCK_HISTORY_RESPONSE });

    const result = await getCurrentBalance();

    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      1,
      "https://api.hyperbolic.xyz/v1/billing/get_current_balance",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-api-key",
        },
      },
    );

    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      "https://api.hyperbolic.xyz/v1/billing/purchase_history",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-api-key",
        },
      },
    );

    // Verify the formatted output contains expected information
    expect(result).toContain("Your current Hyperbolic platform balance is $150.00");
    expect(result).toContain("Purchase History:");
    expect(result).toContain("$100.00 on March 15, 2024");
    expect(result).toContain("$50.00 on March 10, 2024");
  }
}

describe("Get Current Balance", () => {
  const testInstance = new GetCurrentBalanceTest();

  beforeEach(() => testInstance.beforeEach());
  afterEach(() => testInstance.afterEach());

  it("should successfully fetch and format balance information", async () => {
    await testInstance.testFetchAndFormatBalanceInformation();
  });

  it("should handle empty purchase history", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: MOCK_BALANCE_RESPONSE })
      .mockResolvedValueOnce({ data: { purchase_history: [] } });

    const result = await getCurrentBalance();

    expect(result).toContain("Your current Hyperbolic platform balance is $150.00");
    expect(result).toContain("No previous purchases found.");
  });

  it("should throw error when API key is missing", async () => {
    delete process.env.HYPERBOLIC_API_KEY;

    await expect(getCurrentBalance()).rejects.toThrow("Failed to fetch balance data");
  });

  it("should handle API errors appropriately", async () => {
    const error = new Error("API Error");
    mockedAxios.get.mockRejectedValueOnce(error);

    await expect(getCurrentBalance()).rejects.toThrow("Failed to fetch balance data");
  });
});
