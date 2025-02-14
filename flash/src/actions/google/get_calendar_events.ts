import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../zap_action";
import { GoogleConfig } from "../../config/google_config";

// Schema for calendar event response data
const CalendarEventSchema = z.object({
  id: z.string(),
  summary: z.string(),
  description: z.optional(z.string()),
  start: z.object({
    dateTime: z.string(),
    timeZone: z.optional(z.string()),
  }),
  end: z.object({
    dateTime: z.string(),
    timeZone: z.optional(z.string()),
  }),
  status: z.string(),
  created: z.string(),
  updated: z.string(),
  organizer: z.object({
    email: z.string(),
    displayName: z.optional(z.string()),
  }),
  attendees: z.optional(
    z.array(
      z.object({
        email: z.string(),
        displayName: z.optional(z.string()),
        responseStatus: z.string(),
      }),
    ),
  ),
});

// Input schema matching the Pydantic model
const GetCalendarEventsSchema = z
  .object({
    calendar_id: z
      .string()
      .describe("Google Calendar ID. The format should follow {user_name}@{domain}."),
    time_max: z
      .string()
      .optional()
      .describe(
        "Upper bound (exclusive) for an event's start time to filter by. " +
          "Optional. The default is current time + 30 days. " +
          "Must be an RFC3339 timestamp with mandatory time zone offset.",
      ),
    time_min: z
      .string()
      .optional()
      .describe(
        "Lower bound (exclusive) for an event's end time to filter by. " +
          "Optional. The default is current time. " +
          "Must be an RFC3339 timestamp with mandatory time zone offset.",
      ),
    event_types: z
      .string()
      .optional()
      .default("default")
      .describe(
        "Event types to return. Optional. Values: birthday, default, focusTime, fromGmail, outOfOffice, workingLocation",
      ),
    max_results: z
      .number()
      .default(100)
      .describe("Maximum number of events returned on one result page."),
  })
  .strict();

const GET_CALENDAR_EVENTS_PROMPT = `
This tool will get events from a Google Calendar.

Required inputs:
- calendar_id: The Google Calendar ID in the format {user_name}@{domain}

Optional inputs:
- time_max: Upper bound for event start time (RFC3339 timestamp)
- time_min: Lower bound for event end time (RFC3339 timestamp)
- event_types: Type of events to return (default: "default")
- max_results: Maximum number of events to return (default: 100)

Important notes:
- Authorization token is required for this operation
- Timestamps must include timezone offset (e.g. 2024-02-11T10:00:00-07:00)
- Event types can be: birthday, default, focusTime, fromGmail, outOfOffice, workingLocation
`;

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
  public name = "get_calendar_events";
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
