import { z } from "zod";
import axios from "axios";
import { insertCalendarEvent, GoogleInsertCalendarEventRequest, CalendarEventResponse } from "../../actions/google/insert_calendar_events";
import { GoogleConfig } from "../../actions/google/config/google_config";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

class InsertCalendarEventTest {
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

  getValidEventParams(overrides = {}): GoogleInsertCalendarEventRequest {
    return {
      calendar_id: "test@example.com",
      summary: "Test Event",
      description: "Test Description",
      start_datetime: "2024-02-11T10:00:00Z",
      end_datetime: "2024-02-11T11:00:00Z",
      attendees: ["attendee1@example.com", "attendee2@example.com"],
      send_updates: "none",
      ...overrides
    };
  }

  getMockEventResponse(overrides = {}) {
    return {
      id: "event123",
      status: "confirmed",
      htmlLink: "https://calendar.google.com/event123",
      created: "2024-02-11T09:00:00Z",
      updated: "2024-02-11T09:00:00Z",
      summary: "Test Event",
      description: "Test Description",
      creator: {
        email: "creator@example.com",
        displayName: "Test Creator"
      },
      organizer: {
        email: "organizer@example.com",
        displayName: "Test Organizer"
      },
      start: {
        dateTime: "2024-02-11T10:00:00Z",
        timeZone: "UTC"
      },
      end: {
        dateTime: "2024-02-11T11:00:00Z",
        timeZone: "UTC"
      },
      attendees: [
        {
          email: "attendee1@example.com",
          displayName: "Test Attendee 1",
          responseStatus: "needsAction"
        },
        {
          email: "attendee2@example.com",
          displayName: "Test Attendee 2",
          responseStatus: "needsAction"
        }
      ],
      ...overrides
    };
  }

  async testSuccessfulEventCreation() {
    const params = this.getValidEventParams();
    const mockResponse = this.getMockEventResponse();
    
    mockedAxios.post.mockResolvedValueOnce({
      data: mockResponse
    });

    const result = await insertCalendarEvent(params) as CalendarEventResponse;
    
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `https://www.googleapis.com/calendar/v3/calendars/${params.calendar_id}/events`,
      {
        summary: params.summary,
        description: params.description,
        start: {
          dateTime: params.start_datetime
        },
        end: {
          dateTime: params.end_datetime
        },
        attendees: params.attendees.map(email => ({ email }))
      },
      {
        params: {
          sendUpdates: params.send_updates
        },
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json"
        }
      }
    );

    expect(result.id).toBe("event123");
    expect(result.status).toBe("confirmed");
    expect(result.summary).toBe("Test Event");
  }

  async testMissingToken() {
    // Reset config and clear token
    GoogleConfig.resetInstance();
    delete process.env.GOOGLE_API_TOKEN;

    const params = this.getValidEventParams();
    const result = await insertCalendarEvent(params);
    
    expect(result).toBe("failed to insert calendar event. error: token not found");
    expect(mockedAxios.post).not.toHaveBeenCalled();
  }

  async testInvalidCalendarId() {
    const params = this.getValidEventParams({
      calendar_id: "invalid-calendar-id" // Not in email format
    });

    await expect(insertCalendarEvent(params)).rejects.toThrow(
      /Calendar ID must be in email format/
    );
  }

  async testInvalidDateTime() {
    const params = this.getValidEventParams({
      start_datetime: "invalid-date",
      end_datetime: "2024-02-11T11:00:00Z"
    });

    await expect(insertCalendarEvent(params)).rejects.toThrow(
      /Must be RFC3339 format/
    );
  }

  async testInvalidAttendeeEmail() {
    const params = this.getValidEventParams({
      attendees: ["not-an-email", "valid@example.com"]
    });

    await expect(insertCalendarEvent(params)).rejects.toThrow(
      /Each attendee must be a valid email/
    );
  }

  async testApiError() {
    const params = this.getValidEventParams();
    
    mockedAxios.post.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: {
          error: {
            message: "Calendar not found"
          }
        }
      }
    });

    const result = await insertCalendarEvent(params);
    expect(result).toBe("failed to insert calendar event. error: Calendar not found");
  }

  async testNonAxiosError() {
    const params = this.getValidEventParams();
    
    mockedAxios.post.mockRejectedValueOnce(new Error("Unknown error"));

    const result = await insertCalendarEvent(params);
    expect(result).toBe("failed to insert calendar event. error: Unknown error");
  }

  async testOptionalFields() {
    const params = this.getValidEventParams({
      description: undefined,
      attendees: []
    });

    const mockResponse = this.getMockEventResponse({
      description: undefined,
      attendees: undefined
    });

    mockedAxios.post.mockResolvedValueOnce({
      data: mockResponse
    });

    const result = await insertCalendarEvent(params) as CalendarEventResponse;
    
    expect(result.description).toBeUndefined();
    expect(result.attendees).toBeUndefined();
  }

  async testSendUpdatesOptions() {
    const params = this.getValidEventParams({
      send_updates: "all"
    });

    mockedAxios.post.mockResolvedValueOnce({
      data: this.getMockEventResponse()
    });

    await insertCalendarEvent(params);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({
        params: {
          sendUpdates: "all"
        }
      })
    );
  }
}

describe("Insert Calendar Event", () => {
  const testInstance = new InsertCalendarEventTest();

  beforeEach(() => testInstance.beforeEach());
  afterEach(() => testInstance.afterEach());

  it("should successfully create calendar event", async () => {
    await testInstance.testSuccessfulEventCreation();
  });

  it("should handle missing API token", async () => {
    await testInstance.testMissingToken();
  });

  it("should validate calendar ID format", async () => {
    await testInstance.testInvalidCalendarId();
  });

  it("should validate datetime format", async () => {
    await testInstance.testInvalidDateTime();
  });

  it("should validate attendee email format", async () => {
    await testInstance.testInvalidAttendeeEmail();
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

  it("should handle different send_updates options", async () => {
    await testInstance.testSendUpdatesOptions();
  });
});