import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../zap_action";
import { GoogleConfig } from "../../config/google_config";
import { InsertCalendarEventSchema, INSERT_CALENDAR_EVENT_PROMPT, INSERT_CALENDAR_EVENT_ACTION_NAME, CalendarEventResponseSchema } from "../../actions_schemas/google/insert_calendar_events";

/**
 * Insert a new event into Google Calendar
 * @param params Event parameters including title, time, and attendees
 * @returns Created event data or error message
 */
export async function insertCalendarEvent(
  params: z.infer<typeof InsertCalendarEventSchema>,
): Promise<string | z.infer<typeof CalendarEventResponseSchema>> {
  const config = GoogleConfig.getInstance();
  const token = config.getToken();

  if (!token) {
    return "failed to insert calendar event. error: token not found";
  }

  try {
    const response = await axios.post(
      `https://www.googleapis.com/calendar/v3/calendars/${params.calendar_id}/events`,
      {
        summary: params.summary,
        description: params.description,
        start: {
          dateTime: params.start_datetime,
        },
        end: {
          dateTime: params.end_datetime,
        },
        attendees: params.attendees.map(email => ({ email })),
      },
      {
        params: {
          sendUpdates: params.send_updates,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    // Parse and validate response data
    const parsedResponse = CalendarEventResponseSchema.parse(response.data);
    return parsedResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return `failed to insert calendar event. error: ${errorMessage}`;
    }
    return `failed to insert calendar event. error: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

/**
 * Action class for inserting Google Calendar events
 */
export class InsertCalendarEventAction implements ZapAction<typeof InsertCalendarEventSchema> {
  public name = INSERT_CALENDAR_EVENT_ACTION_NAME;
  public description = INSERT_CALENDAR_EVENT_PROMPT;
  public schema = InsertCalendarEventSchema;

  public func = async (args: { [key: string]: any }): Promise<string> => {
    const result = await insertCalendarEvent({
      calendar_id: args.calendar_id,
      send_updates: args.send_updates,
      summary: args.summary,
      description: args.description,
      start_datetime: args.start_datetime,
      end_datetime: args.end_datetime,
      attendees: args.attendees,
    });

    return typeof result === "string" ? result : JSON.stringify(result);
  };
}

// Type exports for use in tests
export type GoogleInsertCalendarEventRequest = z.infer<typeof InsertCalendarEventSchema>;
export type CalendarEventResponse = z.infer<typeof CalendarEventResponseSchema>;
