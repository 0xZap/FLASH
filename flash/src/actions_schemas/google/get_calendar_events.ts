import { z } from "zod";

export const GET_CALENDAR_EVENTS_ACTION_NAME = "get_calendar_events";

// Schema for calendar event response data
export const CalendarEventSchema = z.object({
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
  export const GetCalendarEventsSchema = z
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
  
  export const GET_CALENDAR_EVENTS_PROMPT = `
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
  