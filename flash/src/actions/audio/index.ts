import { ZapAction, ZapActionSchema } from "../zap_action";
import { ELEVENLABS_ACTIONS } from "./elevenlabs";

/**
 * Retrieves all audio action instances.
 * 
 * @returns - Array of audio action instances
 */
export function getAudioActions(): ZapAction<ZapActionSchema>[] {
  return [
    ...ELEVENLABS_ACTIONS,
    // Add other audio provider actions here as they are implemented
  ];
}

export const AUDIO_ACTIONS = getAudioActions();

export * from "./elevenlabs"; 