import axios from "axios";
import { linkWalletAddress } from "../actions/hyperbolic/link_wallet_address";
import { HyperbolicConfig } from "../actions/hyperbolic/config/hyperbolic_config";
import { ZapConfig } from "../config/zap_config";

// Mock response data
const MOCK_LINK_RESPONSE = {
  status: "success",
  message: "Wallet address linked successfully",
};

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

class LinkWalletAddressTest {
  OLD_ENV: NodeJS.ProcessEnv;

  constructor() {
    this.OLD_ENV = process.env;
  }

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

  afterEach() {
    process.env = this.OLD_ENV;
    jest.clearAllMocks();
  }
}

describe("Link Wallet Address", () => {
  const testInstance = new LinkWalletAddressTest();

  beforeEach(() => testInstance.beforeEach());
  afterEach(() => testInstance.afterEach());

  const OLD_ENV = process.env;
  const TEST_WALLET_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";

  it("should successfully link wallet address", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: MOCK_LINK_RESPONSE });

    const result = await linkWalletAddress(TEST_WALLET_ADDRESS);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "https://api.hyperbolic.xyz/settings/crypto-address",
      { address: TEST_WALLET_ADDRESS },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-api-key",
        },
      },
    );

    // Verify the response is properly stringified
    expect(result).toBe(JSON.stringify(MOCK_LINK_RESPONSE, null, 2));
  });

  it("should throw error when API key is missing", async () => {
    delete process.env.HYPERBOLIC_API_KEY;

    await expect(linkWalletAddress(TEST_WALLET_ADDRESS)).rejects.toThrow(
      "Failed to link wallet address",
    );
  });

  it("should handle API errors appropriately", async () => {
    const error = new Error("API Error");
    mockedAxios.post.mockRejectedValueOnce(error);

    await expect(linkWalletAddress(TEST_WALLET_ADDRESS)).rejects.toThrow(
      "Failed to link wallet address",
    );
  });

  it("should handle specific API error messages", async () => {
    const axiosError = {
      isAxiosError: true,
      message: "Invalid wallet address",
    };
    mockedAxios.post.mockRejectedValueOnce(axiosError);

    await expect(linkWalletAddress(TEST_WALLET_ADDRESS)).rejects.toThrow(
      "Failed to link wallet address",
    );
  });
});
