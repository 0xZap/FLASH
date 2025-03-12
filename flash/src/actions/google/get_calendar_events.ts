import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../zap_action";
import { GoogleConfig } from "../../config/google_config";
import { GetCalendarEventsSchema, CalendarEventSchema, GET_CALENDAR_EVENTS_PROMPT, GET_CALENDAR_EVENTS_ACTION_NAME } from "../../actions_schemas/google/get_calendar_events";

/**
 * Get events from Google Calendar.
 * @param params Calendar events request parameters
 * @returns Formatted string of calendar events
 */
export async function getCalendarEvents(params: z.infer<typeof GetCalendarEventsSchema>) {
  const config = GoogleConfig.getInstance();
  const token = config.getToken();

  if (!token) {
    throw new Error("Google API token not found");
  }

  try {
    // Set default time bounds if not provided
    const now = new Date();
    const defaultTimeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const response = await axios.get(
      `https://www.googleapis.com/calendar/v3/calendars/${params.calendar_id}/events`,
      {
        params: {
          orderBy: "updated",
          timeMin: params.time_min || now.toISOString(),
          timeMax: params.time_max || defaultTimeMax.toISOString(),
          maxResults: params.max_results,
          eventTypes: params.event_types,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const events = response.data.items.map((event: z.infer<typeof CalendarEventSchema>) => {
      const startTime = new Date(event.start.dateTime);
      const endTime = new Date(event.end.dateTime);

      return `${event.summary}:
- Time: ${startTime.toLocaleString()} - ${endTime.toLocaleString()}
- Status: ${event.status}
- Organizer: ${event.organizer.displayName || event.organizer.email}
${event.description ? `- Description: ${event.description}\n` : ""}${
        event.attendees
          ? `- Attendees:\n${event.attendees
              .map(
                attendee =>
                  `  • ${attendee.displayName || attendee.email} (${attendee.responseStatus})`,
              )
              .join("\n")}`
          : ""
      }`;
    });

    return events.join("\n\n");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch calendar events: ${error.message}`);
    }
    throw new Error("Failed to fetch calendar events");
  }
}

/**
 * Action to get events from Google Calendar.
 */
export class GetCalendarEventsAction implements ZapAction<typeof GetCalendarEventsSchema> {
  public name = GET_CALENDAR_EVENTS_ACTION_NAME;
  public description = GET_CALENDAR_EVENTS_PROMPT;
  public schema = GetCalendarEventsSchema;

  public func = (args: { [key: string]: any }) =>
    getCalendarEvents({
      calendar_id: args.calendar_id,
      time_max: args.time_max,
      time_min: args.time_min,
      event_types: args.event_types,
      max_results: args.max_results,
    });
}
