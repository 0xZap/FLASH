import { z } from "zod";

export const INSERT_CALENDAR_EVENT_ACTION_NAME = "insert_calendar_event";

// Schema for calendar event response
export const CalendarEventResponseSchema = z.object({
    id: z.string(),
    status: z.string(),
    htmlLink: z.string().optional(),
    created: z.string().optional(),
    updated: z.string().optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    creator: z
      .object({
        email: z.string(),
        displayName: z.string().optional(),
      })
      .optional(),
    organizer: z
      .object({
        email: z.string(),
        displayName: z.string().optional(),
      })
      .optional(),
    start: z.object({
      dateTime: z.string(),
      timeZone: z.string().optional(),
    }),
    end: z.object({
      dateTime: z.string(),
      timeZone: z.string().optional(),
    }),
    attendees: z
      .array(
        z.object({
          email: z.string(),
          responseStatus: z.string().optional(),
          displayName: z.string().optional(),
        }),
      )
      .optional(),
  });
  
  // Input schema for the insert calendar event function
  export const InsertCalendarEventSchema = z
    .object({
      calendar_id: z
        .string()
        .regex(/^[^@]+@[^@]+\.[^@]+$/, "Calendar ID must be in email format")
        .describe("Google Calendar ID in format username@domain"),
      send_updates: z
        .enum(["all", "externalOnly", "none"])
        .default("none")
        .describe("Controls notification behavior for event creation"),
      summary: z.string().min(1, "Event title cannot be empty").describe("Event title/summary"),
      description: z.string().optional().describe("Optional event description"),
      start_datetime: z
        .string()
        .regex(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/,
          "Must be RFC3339 format",
        )
        .describe("Event start time in RFC3339 format"),
      end_datetime: z
        .string()
        .regex(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/,
          "Must be RFC3339 format",
        )
        .describe("Event end time in RFC3339 format"),
      attendees: z
        .array(z.string().email("Each attendee must be a valid email"))
        .default([])
        .describe("List of attendee email addresses"),
    })
    .strict();
  
  export const INSERT_CALENDAR_EVENT_PROMPT = `
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