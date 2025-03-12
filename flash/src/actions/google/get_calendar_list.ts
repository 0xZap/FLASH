import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../zap_action";
import { GoogleConfig } from "../../config/google_config";
import { GetCalendarListSchema, GET_CALENDAR_LIST_PROMPT, GET_CALENDAR_LIST_ACTION_NAME, CalendarListResponseSchema } from "../../actions_schemas/google/get_calendar_list";



/**
 * Get list of calendars from Google Calendar
 * @returns Calendar list data or error message
 */
export async function getCalendarList(): Promise<
  string | z.infer<typeof CalendarListResponseSchema>
> {
  const config = GoogleConfig.getInstance();
  const token = config.getToken();

  if (!token) {
    return "failed to get calendar list. error: token not found";
  }

  try {
    const response = await axios.get(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    // Parse and validate response data
    const parsedResponse = CalendarListResponseSchema.parse(response.data);

    // If no calendars found, return empty list
    if (!parsedResponse.items) {
      return {
        items: [],
        kind: "calendar#calendarList",
      };
    }

    return parsedResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return `failed to get calendar list. error: ${errorMessage}`;
    }
    return `failed to get calendar list. error: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

/**
 * Action class for getting Google Calendar list
 */
export class GetCalendarListAction implements ZapAction<typeof GetCalendarListSchema> {
  public name = GET_CALENDAR_LIST_ACTION_NAME;
  public description = GET_CALENDAR_LIST_PROMPT;
  public schema = GetCalendarListSchema;
  public func = async (args: {}) => {
    const result = await getCalendarList();
    return typeof result === "string" ? result : JSON.stringify(result);
  };
}

// Type exports for use in tests
export type CalendarListResponse = z.infer<typeof CalendarListResponseSchema>;
