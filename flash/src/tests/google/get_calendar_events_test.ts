import { GoogleConfig } from "../../actions/google/config/google_config";
import { getCalendarEvents } from "../../actions/google/get_calendar_events";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

class GetCalendarEventsTest {
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
      token: "test-token",
    });

    // Reset date to a fixed point for testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-02-11T10:00:00Z"));
  }

  afterEach() {
    // Clean up after each test
    jest.clearAllMocks();
    jest.useRealTimers();
    process.env = this.OLD_ENV;
  }

  getMockCalendarEvent(overrides = {}) {
    return {
      id: "event123",
      summary: "Test Meeting",
      description: "Test Description",
      start: {
        dateTime: "2024-02-11T10:00:00Z",
        timeZone: "UTC",
      },
      end: {
        dateTime: "2024-02-11T11:00:00Z",
        timeZone: "UTC",
      },
      status: "confirmed",
      created: "2024-02-10T10:00:00Z",
      updated: "2024-02-10T10:00:00Z",
      organizer: {
        email: "organizer@example.com",
        displayName: "Test Organizer",
      },
      attendees: [
        {
          email: "attendee1@example.com",
          displayName: "Test Attendee 1",
          responseStatus: "accepted",
        },
        {
          email: "attendee2@example.com",
          displayName: "Test Attendee 2",
          responseStatus: "needsAction",
        },
      ],
      ...overrides,
    };
  }

  async testSuccessfulEventRetrieval() {
    const params = {
      event_types: "default",
      calendar_id: "test@example.com",
      max_results: 10,
    };

    const mockEvent = this.getMockCalendarEvent();

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        items: [mockEvent],
      },
    });

    const result = await getCalendarEvents(params);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      `https://www.googleapis.com/calendar/v3/calendars/${params.calendar_id}/events`,
      {
        params: {
          orderBy: "updated",
          timeMin: new Date("2024-02-11T10:00:00Z").toISOString(),
          timeMax: new Date("2024-03-12T10:00:00Z").toISOString(),
          maxResults: params.max_results,
          eventTypes: "default",
        },
        headers: {
          Authorization: "Bearer test-token",
        },
      },
    );

    // Verify formatted output contains expected event details
    expect(result).toContain("Test Meeting");
    expect(result).toContain("Test Description");
    expect(result).toContain("Test Organizer");
    expect(result).toContain("Test Attendee 1 (accepted)");
    expect(result).toContain("Test Attendee 2 (needsAction)");
  }

  async testCustomTimeRange() {
    const params = {
      event_types: "default",
      calendar_id: "test@example.com",
      time_min: "2024-03-01T00:00:00Z",
      time_max: "2024-03-31T23:59:59Z",
      max_results: 10,
    };

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        items: [this.getMockCalendarEvent()],
      },
    });

    await getCalendarEvents(params);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        params: expect.objectContaining({
          timeMin: params.time_min,
          timeMax: params.time_max,
        }),
      }),
    );
  }

  async testEventWithoutOptionalFields() {
    const mockEvent = this.getMockCalendarEvent({
      description: undefined,
      attendees: undefined,
    });

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        items: [mockEvent],
      },
    });

    const result = await getCalendarEvents({
      calendar_id: "test@example.com",
      max_results: 100,
      event_types: "default",
    });

    expect(result).not.toContain("Description:");
    expect(result).not.toContain("Attendees:");
    expect(result).toContain("Test Meeting");
  }

  async testMissingToken() {
    // Reset config and clear token
    GoogleConfig.resetInstance();
    delete process.env.GOOGLE_API_TOKEN;

    const params = {
      event_types: "default",
      calendar_id: "test@example.com",
      max_results: 100,
    };

    await expect(getCalendarEvents(params)).rejects.toThrow("Google API token not found");
    expect(mockedAxios.get).not.toHaveBeenCalled();
  }

  async testApiError() {
    const params = {
      event_types: "default",
      max_results: 100,
      calendar_id: "test@example.com",
    };

    mockedAxios.get.mockRejectedValueOnce({
      isAxiosError: true,
      message: "Calendar not found",
    });

    await expect(getCalendarEvents(params)).rejects.toThrow(
      "Failed to fetch calendar events: Calendar not found",
    );
  }

  async testNonAxiosError() {
    const params = {
      event_types: "default",
      max_results: 100,
      calendar_id: "test@example.com",
    };

    mockedAxios.get.mockRejectedValueOnce(new Error("Unknown error"));

    await expect(getCalendarEvents(params)).rejects.toThrow("Failed to fetch calendar events");
  }

  async testCustomEventTypes() {
    const params = {
      calendar_id: "test@example.com",
      event_types: "focusTime",
      max_results: 100,
    };

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        items: [this.getMockCalendarEvent()],
      },
    });

    await getCalendarEvents(params);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        params: expect.objectContaining({
          eventTypes: "focusTime",
        }),
      }),
    );
  }
}

describe("Get Calendar Events", () => {
  const testInstance = new GetCalendarEventsTest();

  beforeEach(() => testInstance.beforeEach());
  afterEach(() => testInstance.afterEach());

  it("should successfully retrieve calendar events", async () => {
    await testInstance.testSuccessfulEventRetrieval();
  });

  it("should handle custom time ranges", async () => {
    await testInstance.testCustomTimeRange();
  });

  it("should handle events without optional fields", async () => {
    await testInstance.testEventWithoutOptionalFields();
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

  it("should handle custom event types", async () => {
    await testInstance.testCustomEventTypes();
  });
});
