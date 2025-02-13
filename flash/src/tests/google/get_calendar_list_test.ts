import { z } from "zod";
import axios from "axios";
import { getCalendarList, CalendarListResponse } from "../../actions/google/get_calendar_list";
import { GoogleConfig } from "../../actions/google/config/google_config";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

class GetCalendarListTest {
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

  getMockCalendarEntry(overrides = {}) {
    return {
      id: "calendar123",
      summary: "Test Calendar",
      description: "Test Description",
      location: "Test Location",
      timeZone: "UTC",
      colorId: "1",
      backgroundColor: "#ffffff",
      foregroundColor: "#000000",
      selected: true,
      primary: false,
      deleted: false,
      accessRole: "owner",
      defaultReminders: [
        {
          method: "email",
          minutes: 30
        }
      ],
      ...overrides
    };
  }

  async testSuccessfulCalendarListRetrieval() {
    const mockCalendar = this.getMockCalendarEntry();
    
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        kind: "calendar#calendarList",
        etag: "etag123",
        items: [mockCalendar]
      }
    });

    const result = await getCalendarList() as CalendarListResponse;
    
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json"
        }
      }
    );

    expect(result.items?.[0]).toMatchObject({
      id: "calendar123",
      summary: "Test Calendar",
      description: "Test Description"
    });
  }

  async testEmptyCalendarList() {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        kind: "calendar#calendarList",
        etag: "etag123",
        items: []
      }
    });

    const result = await getCalendarList() as CalendarListResponse;
    
    expect(result.items).toHaveLength(0);
    expect(result.kind).toBe("calendar#calendarList");
  }

  async testMissingToken() {
    // Reset config and clear token
    GoogleConfig.resetInstance();
    delete process.env.GOOGLE_API_TOKEN;

    const result = await getCalendarList();
    
    expect(result).toBe("failed to get calendar list. error: token not found");
    expect(mockedAxios.get).not.toHaveBeenCalled();
  }

  async testApiError() {
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

    const result = await getCalendarList();
    
    expect(result).toBe("failed to get calendar list. error: Invalid credentials");
  }

  async testNonAxiosError() {
    mockedAxios.get.mockRejectedValueOnce(new Error("Unknown error"));

    const result = await getCalendarList();
    
    expect(result).toBe("failed to get calendar list. error: Unknown error");
  }

  async testInvalidResponseSchema() {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        kind: "calendar#calendarList",
        items: [
          {
            id: 123, // Should be string according to schema
            invalidField: "test"
          }
        ]
      }
    });

    await expect(getCalendarList()).rejects.toThrow();
  }

  async testOptionalFields() {
    const mockCalendar = this.getMockCalendarEntry({
      description: undefined,
      location: undefined,
      defaultReminders: undefined
    });

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        kind: "calendar#calendarList",
        items: [mockCalendar]
      }
    });

    const result = await getCalendarList() as CalendarListResponse;
    
    expect(result.items?.[0].description).toBeUndefined();
    expect(result.items?.[0].location).toBeUndefined();
    expect(result.items?.[0].defaultReminders).toBeUndefined();
  }
}

describe("Get Calendar List", () => {
  const testInstance = new GetCalendarListTest();

  beforeEach(() => testInstance.beforeEach());
  afterEach(() => testInstance.afterEach());

  it("should successfully retrieve calendar list", async () => {
    await testInstance.testSuccessfulCalendarListRetrieval();
  });

  it("should handle empty calendar list", async () => {
    await testInstance.testEmptyCalendarList();
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

  it("should handle invalid response schema", async () => {
    await testInstance.testInvalidResponseSchema();
  });

  it("should handle optional fields", async () => {
    await testInstance.testOptionalFields();
  });
});