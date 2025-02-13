import { z } from "zod";
import axios from "axios";
import { listGmail, GoogleListGmailRequest, GmailListResponse } from "../../actions/google/list_gmail";
import { GoogleConfig } from "../../actions/google/config/google_config";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

class ListGmailTest {
  OLD_ENV: NodeJS.ProcessEnv;

  constructor() {
    this.OLD_ENV = process.env;
  }

  beforeEach() {
    // Reset modules and environment before each test
    jest.resetModules();
    process.env = { ...this.OLD_ENV };
    
    // Reset singleton instance
    GoogleConfig.resetInstance();
    
    // Set up required environment variables
    process.env.GOOGLE_API_TOKEN = "test-token";
    
    // Initialize config with test values
    GoogleConfig.getInstance({
      token: "test-token"
    });
  }

  afterEach() {
    // Clean up after each test
    jest.clearAllMocks();
    process.env = this.OLD_ENV;
  }

  getMockGmailMessage(overrides = {}) {
    return {
      id: "msg123",
      threadId: "thread123",
      labelIds: ["INBOX", "UNREAD"],
      snippet: "Test email content snippet...",
      historyId: "12345",
      internalDate: "1644567890000",
      sizeEstimate: 52000,
      ...overrides
    };
  }

  async testSuccessfulMessageListing() {
    const params: GoogleListGmailRequest = {};
    const mockMessage = this.getMockGmailMessage();
    
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        messages: [mockMessage],
        nextPageToken: "next_token",
        resultSizeEstimate: 1
      }
    });

    const result = await listGmail(params) as GmailListResponse;
    
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages",
      {
        params: {
          q: undefined
        },
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json"
        }
      }
    );

    expect(result.messages?.[0]).toMatchObject({
      id: "msg123",
      threadId: "thread123",
      labelIds: ["INBOX", "UNREAD"]
    });
    expect(result.nextPageToken).toBe("next_token");
    expect(result.resultSizeEstimate).toBe(1);
  }

  async testQueryFiltering() {
    const params: GoogleListGmailRequest = {
      q: "in:inbox is:unread"
    };
    
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        messages: [this.getMockGmailMessage()],
        resultSizeEstimate: 1
      }
    });

    await listGmail(params);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        params: {
          q: "in:inbox is:unread"
        }
      })
    );
  }

  async testEmptyMessageList() {
    const params: GoogleListGmailRequest = {};
    
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        messages: [],
        resultSizeEstimate: 0
      }
    });

    const result = await listGmail(params) as GmailListResponse;
    
    expect(result.messages).toHaveLength(0);
    expect(result.resultSizeEstimate).toBe(0);
  }

  async testMissingToken() {
    // Reset config and clear token
    GoogleConfig.resetInstance();
    delete process.env.GOOGLE_API_TOKEN;

    const params: GoogleListGmailRequest = {};
    const result = await listGmail(params);
    
    expect(result).toBe("failed to get mail list. error: token not found");
    expect(mockedAxios.get).not.toHaveBeenCalled();
  }

  async testApiError() {
    const params: GoogleListGmailRequest = {};
    
    mockedAxios.get.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: {
          error: {
            message: "Invalid credentials"
          }
        }
      }
    });

    const result = await listGmail(params);
    expect(result).toBe("failed to get mail list. error: Invalid credentials");
  }

  async testNonAxiosError() {
    const params: GoogleListGmailRequest = {};
    
    mockedAxios.get.mockRejectedValueOnce(new Error("Unknown error"));

    const result = await listGmail(params);
    expect(result).toBe("failed to get mail list. error: Unknown error");
  }

  async testOptionalFields() {
    const mockMessage = this.getMockGmailMessage({
      labelIds: undefined,
      snippet: undefined,
      payload: undefined
    });

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        messages: [mockMessage]
      }
    });

    const result = await listGmail({}) as GmailListResponse;
    
    expect(result.messages?.[0].labelIds).toBeUndefined();
    expect(result.messages?.[0].snippet).toBeUndefined();
    expect(result.messages?.[0].payload).toBeUndefined();
  }

  async testPagination() {
    const params: GoogleListGmailRequest = {};
    
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        messages: [this.getMockGmailMessage()],
        nextPageToken: "next_page_token_123",
        resultSizeEstimate: 100
      }
    });

    const result = await listGmail(params) as GmailListResponse;
    
    expect(result.nextPageToken).toBe("next_page_token_123");
    expect(result.resultSizeEstimate).toBe(100);
  }
}

describe("List Gmail Messages", () => {
  const testInstance = new ListGmailTest();

  beforeEach(() => testInstance.beforeEach());
  afterEach(() => testInstance.afterEach());

  it("should successfully list Gmail messages", async () => {
    await testInstance.testSuccessfulMessageListing();
  });

  it("should handle query filtering", async () => {
    await testInstance.testQueryFiltering();
  });

  it("should handle empty message list", async () => {
    await testInstance.testEmptyMessageList();
  });

  it("should handle missing API token", async () => {
    await testInstance.testMissingToken();
  });

  it("should handle API errors", async () => {
    await testInstance.testApiError();
  });

  it("should handle non-Axios errors", async () => {
    await testInstance.testNonAxiosError();
  });

  it("should handle optional fields", async () => {
    await testInstance.testOptionalFields();
  });

  it("should handle pagination", async () => {
    await testInstance.testPagination();
  });
});