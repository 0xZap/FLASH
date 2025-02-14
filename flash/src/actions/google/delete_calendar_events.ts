import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../zap_action";
import { GoogleConfig } from "../../config/google_config";

// Schema for request validation
const GoogleDeleteCalendarEventsSchema = z
  .object({
    calendar_id: z.string().regex(/^[^@]+@[^@]+\.[^@]+$/, "Calendar ID must be in email format"),
    event_id: z.string().min(1, "Event ID cannot be empty"),
    send_updates: z.enum(["all", "externalOnly", "none"]).default("none"),
  })
  .strict();

const DELETE_CALENDAR_EVENTS_PROMPT = `This tool will delete a specified event from a Google Calendar.

Required inputs:
- calendar_id: The Google Calendar ID (format: user@domain.com)
- event_id: The unique identifier of the event to delete

Optional inputs:
- send_updates: Controls notification behavior (default: "none")
  - "all": Notifications sent to all guests
  - "externalOnly": Notifications sent to non-Google Calendar guests only
  - "none": No notifications sent

Important notes:
- Requires valid Google Calendar API authorization token
- Operation cannot be undone
- Returns success/failure message
`;

/**
 * Delete a specific event from Google Calendar
 * @param params Request parameters containing calendar_id, event_id, and send_updates
 * @returns Success or error message
 */
export async function deleteCalendarEvents(
  params: z.infer<typeof GoogleDeleteCalendarEventsSchema>,
): Promise<string> {
  const config = GoogleConfig.getInstance();
  const token = config.getToken();

  if (!token) {
    return "failed to delete calendar events. error: token not found";
  }

  try {
    await axios.delete(
      `https://www.googleapis.com/calendar/v3/calendars/${params.calendar_id}/events/${params.event_id}`,
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

    return `successfully deleted calendar events ${params.event_id}`;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return `failed to delete calendar events. error: ${errorMessage}`;
    }
    return `failed to delete calendar events. error: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

/**
 * Action class for deleting Google Calendar events
 */
export class DeleteCalendarEventsAction
  implements ZapAction<typeof GoogleDeleteCalendarEventsSchema>
{
  public name = "delete_calendar_events";
  public description = DELETE_CALENDAR_EVENTS_PROMPT;
  public schema = GoogleDeleteCalendarEventsSchema;
  public func = (args: { [key: string]: any }) =>
    deleteCalendarEvents({
      calendar_id: args.calendar_id,
      event_id: args.event_id,
      send_updates: args.send_updates,
    });
}

// Type for the request parameters, exported for use in tests
export type GoogleDeleteCalendarEventsRequest = z.infer<typeof GoogleDeleteCalendarEventsSchema>;
