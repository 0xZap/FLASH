import { z } from "zod";

export const DELETE_CALENDAR_EVENTS_ACTION_NAME = "delete_calendar_events";

export const GoogleDeleteCalendarEventsSchema = z
  .object({
    calendar_id: z.string().regex(/^[^@]+@[^@]+\.[^@]+$/, "Calendar ID must be in email format"),
    event_id: z.string().min(1, "Event ID cannot be empty"),
    send_updates: z.enum(["all", "externalOnly", "none"]).default("none"),
  })
  .strict();

export const DELETE_CALENDAR_EVENTS_PROMPT = `This tool will delete a specified event from a Google Calendar.

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