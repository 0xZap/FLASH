import { GoogleConfig } from "../../actions/google/config/google_config";
import {
  deleteCalendarEvents,
  GoogleDeleteCalendarEventsRequest,
} from "../../actions/google/delete_calendar_events";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

class DeleteCalendarEventsTest {
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
  }

  afterEach() {
    // Clean up after each test
    jest.clearAllMocks();
    process.env = this.OLD_ENV;
  }

  async testSuccessfulEventDeletion() {
    const params: GoogleDeleteCalendarEventsRequest = {
      calendar_id: "test@example.com",
      event_id: "event123",
      send_updates: "none",
    };

    mockedAxios.delete.mockResolvedValueOnce({ status: 204 });

    const result = await deleteCalendarEvents(params);

    expect(mockedAxios.delete).toHaveBeenCalledWith(
      `https://www.googleapis.com/calendar/v3/calendars/${params.calendar_id}/events/${params.event_id}`,
      {
        params: {
          sendUpdates: params.send_updates,
        },
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        },
      },
    );

    expect(result).toBe("successfully deleted calendar events event123");
  }

  async testMissingToken() {
    // Reset config and clear token
    GoogleConfig.resetInstance();
    delete process.env.GOOGLE_API_TOKEN;

    const params: GoogleDeleteCalendarEventsRequest = {
      calendar_id: "test@example.com",
      event_id: "event123",
      send_updates: "none",
    };

    const result = await deleteCalendarEvents(params);
    expect(result).toBe("failed to delete calendar events. error: token not found");
    expect(mockedAxios.delete).not.toHaveBeenCalled();
  }

  async testApiError() {
    const params: GoogleDeleteCalendarEventsRequest = {
      calendar_id: "test@example.com",
      event_id: "event123",
      send_updates: "none",
    };

    const errorResponse = {
      response: {
        data: {
          error: {
            message: "Calendar event not found",
          },
        },
      },
    };

    mockedAxios.delete.mockRejectedValueOnce(errorResponse);

    const result = await deleteCalendarEvents(params);
    expect(result).toBe("failed to delete calendar events. error: Calendar event not found");
  }

  async testNetworkError() {
    const params: GoogleDeleteCalendarEventsRequest = {
      calendar_id: "test@example.com",
      event_id: "event123",
      send_updates: "none",
    };

    mockedAxios.delete.mockRejectedValueOnce(new Error("Network Error"));

    const result = await deleteCalendarEvents(params);
    expect(result).toBe("failed to delete calendar events. error: Network Error");
  }

  async testUnknownError() {
    const params: GoogleDeleteCalendarEventsRequest = {
      calendar_id: "test@example.com",
      event_id: "event123",
      send_updates: "none",
    };

    mockedAxios.delete.mockRejectedValueOnce("Unexpected error");

    const result = await deleteCalendarEvents(params);
    expect(result).toBe("failed to delete calendar events. error: Unknown error");
  }

  async testDifferentSendUpdatesOptions() {
    const testCases: GoogleDeleteCalendarEventsRequest[] = [
      {
        calendar_id: "test@example.com",
        event_id: "event123",
        send_updates: "all",
      },
      {
        calendar_id: "test@example.com",
        event_id: "event123",
        send_updates: "externalOnly",
      },
    ];

    for (const params of testCases) {
      mockedAxios.delete.mockResolvedValueOnce({ status: 204 });

      await deleteCalendarEvents(params);

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        `https://www.googleapis.com/calendar/v3/calendars/${params.calendar_id}/events/${params.event_id}`,
        {
          params: {
            sendUpdates: params.send_updates,
          },
          headers: {
            Authorization: "Bearer test-token",
            "Content-Type": "application/json",
          },
        },
      );
    }
  }
}

describe("Delete Calendar Events", () => {
  const testInstance = new DeleteCalendarEventsTest();

  beforeEach(() => testInstance.beforeEach());
  afterEach(() => testInstance.afterEach());

  it("should successfully delete a calendar event", async () => {
    await testInstance.testSuccessfulEventDeletion();
  });

  it("should handle missing API token", async () => {
    await testInstance.testMissingToken();
  });

  it("should handle API errors", async () => {
    await testInstance.testApiError();
  });

  it("should handle network errors", async () => {
    await testInstance.testNetworkError();
  });

  it("should handle unknown errors", async () => {
    await testInstance.testUnknownError();
  });

  it("should handle different send_updates options", async () => {
    await testInstance.testDifferentSendUpdatesOptions();
  });
});
