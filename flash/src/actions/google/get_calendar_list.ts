import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../zap_action";
import { GoogleConfig } from "../../config/google_config";
// Schema for calendar entry response
const CalendarEntrySchema = z.object({
  id: z.string(),
  summary: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  timeZone: z.string().optional(),
  colorId: z.string().optional(),
  backgroundColor: z.string().optional(),
  foregroundColor: z.string().optional(),
  selected: z.boolean().optional(),
  primary: z.boolean().optional(),
  deleted: z.boolean().optional(),
  accessRole: z.string().optional(),
  defaultReminders: z
    .array(
      z.object({
        method: z.string(),
        minutes: z.number(),
      }),
    )
    .optional(),
});

// Schema for the calendar list response
const CalendarListResponseSchema = z.object({
  kind: z.string().optional(),
  etag: z.string().optional(),
  nextPageToken: z.string().optional(),
  nextSyncToken: z.string().optional(),
  items: z.array(CalendarEntrySchema).optional(),
});

// Input schema (empty as no inputs required)
const GetCalendarListSchema = z.object({}).strict();

const GET_CALENDAR_LIST_PROMPT = `
This tool will get all calendars in the user's Google Calendar list.

It does not take any inputs.

Important notes:
- Requires valid Google Calendar API authorization token
- Returns list of calendars with their metadata
- Includes primary calendar and all subscribed calendars
`;

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
  public name = "get_calendar_list";
  public description = GET_CALENDAR_LIST_PROMPT;
  public schema = GetCalendarListSchema;
  public func = async (args: {}) => {
    const result = await getCalendarList();
    return typeof result === "string" ? result : JSON.stringify(result);
  };
}

// Type exports for use in tests
export type CalendarListResponse = z.infer<typeof CalendarListResponseSchema>;
