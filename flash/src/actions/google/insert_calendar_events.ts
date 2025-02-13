import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../zap_action";
import { GoogleConfig } from "../../config/google_config";

// Schema for calendar event response
const CalendarEventResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
  htmlLink: z.string().optional(),
  created: z.string().optional(),
  updated: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  creator: z.object({
    email: z.string(),
    displayName: z.string().optional()
  }).optional(),
  organizer: z.object({
    email: z.string(),
    displayName: z.string().optional()
  }).optional(),
  start: z.object({
    dateTime: z.string(),
    timeZone: z.string().optional()
  }),
  end: z.object({
    dateTime: z.string(),
    timeZone: z.string().optional()
  }),
  attendees: z.array(z.object({
    email: z.string(),
    responseStatus: z.string().optional(),
    displayName: z.string().optional()
  })).optional()
});

// Input schema for the insert calendar event function
const InsertCalendarEventSchema = z.object({
  calendar_id: z.string()
    .regex(/^[^@]+@[^@]+\.[^@]+$/, "Calendar ID must be in email format")
    .describe("Google Calendar ID in format username@domain"),
  send_updates: z.enum(["all", "externalOnly", "none"])
    .default("none")
    .describe("Controls notification behavior for event creation"),
  summary: z.string()
    .min(1, "Event title cannot be empty")
    .describe("Event title/summary"),
  description: z.string()
    .optional()
    .describe("Optional event description"),
  start_datetime: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/, "Must be RFC3339 format")
    .describe("Event start time in RFC3339 format"),
  end_datetime: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/, "Must be RFC3339 format")
    .describe("Event end time in RFC3339 format"),
  attendees: z.array(z.string()
    .email("Each attendee must be a valid email"))
    .default([])
    .describe("List of attendee email addresses")
}).strict();

const INSERT_CALENDAR_EVENT_PROMPT = `
This tool will create a new event in Google Calendar.

Required inputs:
- calendar_id: Google Calendar ID (format: username@domain)
- summary: Event title
- start_datetime: Start time (RFC3339 format)
- end_datetime: End time (RFC3339 format)

Optional inputs:
- description: Event description
- attendees: List of attendee email addresses
- send_updates: Notification behavior ("all", "externalOnly", "none", default: "none")

Important notes:
- Requires valid Google Calendar API authorization token
- Times must include timezone offset (e.g., 2024-02-11T15:30:00-07:00)
- Returns created event data
`;

/**
 * Insert a new event into Google Calendar
 * @param params Event parameters including title, time, and attendees
 * @returns Created event data or error message
 */
export async function insertCalendarEvent(
  params: z.infer<typeof InsertCalendarEventSchema>
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
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Parse and validate response data
    const parsedResponse = CalendarEventResponseSchema.parse(response.data);
    return parsedResponse;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return `failed to insert calendar event. error: ${errorMessage}`;
    }
    return `failed to insert calendar event. error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Action class for inserting Google Calendar events
 */
export class InsertCalendarEventAction implements ZapAction<typeof InsertCalendarEventSchema> {
    public name = "insert_calendar_event";
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
        attendees: args.attendees
      });
      
      return typeof result === 'string' ? result : JSON.stringify(result);
    };
  }

// Type exports for use in tests
export type GoogleInsertCalendarEventRequest = z.infer<typeof InsertCalendarEventSchema>;
export type CalendarEventResponse = z.infer<typeof CalendarEventResponseSchema>;