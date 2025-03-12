import { z } from "zod";

export const GET_CALENDAR_LIST_ACTION_NAME = "get_calendar_list";

// Schema for calendar entry response
export const CalendarEntrySchema = z.object({
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
  export const CalendarListResponseSchema = z.object({
    kind: z.string().optional(),
    etag: z.string().optional(),
    nextPageToken: z.string().optional(),
    nextSyncToken: z.string().optional(),
    items: z.array(CalendarEntrySchema).optional(),
  });
  
  // Input schema (empty as no inputs required)
  export const GetCalendarListSchema = z.object({}).strict();
  
  export const GET_CALENDAR_LIST_PROMPT = `
  This tool will get all calendars in the user's Google Calendar list.
  
  It does not take any inputs.
  
  Important notes:
  - Requires valid Google Calendar API authorization token
  - Returns list of calendars with their metadata
  - Includes primary calendar and all subscribed calendars
  `;