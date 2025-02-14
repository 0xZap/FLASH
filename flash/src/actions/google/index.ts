import { ZapAction, ZapActionSchema } from "../zap_action";
import { GoogleConfig } from "../../config/google_config";
import { GetCalendarListAction } from "./get_calendar_list";
import { GetCalendarEventsAction } from "./get_calendar_events";
import { DeleteCalendarEventsAction } from "./delete_calendar_events";
import { InsertCalendarEventAction } from "./insert_calendar_events";
import { ListGmailAction } from "./list_gmail";

/**
 * Retrieves all Google action instances.
 * WARNING: All new Google action classes must be instantiated here to be discovered.
 *
 * @returns - Array of Google action instances
 */
export function getGoogleActions(config?: GoogleConfig): ZapAction<ZapActionSchema>[] {
  // If config is provided, ensure it's set as the instance
  if (config) {
    GoogleConfig.resetInstance();
    GoogleConfig.getInstance({ token: config.getToken() });
  }

  return [
    new GetCalendarListAction(),
    new GetCalendarEventsAction(),
    new DeleteCalendarEventsAction(),
    new InsertCalendarEventAction(),
    new ListGmailAction(),
  ];
}

export const GOOGLE_ACTIONS = getGoogleActions();

export {
  GetCalendarListAction,
  GetCalendarEventsAction,
  DeleteCalendarEventsAction,
  InsertCalendarEventAction,
  ListGmailAction,
};
