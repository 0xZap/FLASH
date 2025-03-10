import { ZapAction, ZapActionSchema } from "../zap_action";
import { HEYGEN_ACTIONS } from "./heygen";

/**
 * Retrieves all video action instances.
 * 
 * @returns - Array of video action instances
 */
export function getVideoActions(): ZapAction<ZapActionSchema>[] {
  return [
    ...HEYGEN_ACTIONS,
    // Add other video provider actions here as they are implemented
  ];
}

export const VIDEO_ACTIONS = getVideoActions();

export * from "./heygen"; 