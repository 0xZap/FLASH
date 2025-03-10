import { ZapAction, ZapActionSchema } from "../../zap_action";
import { TextToSpeechAction } from "./text_to_speech";
import { SpeechToTextAction } from "./speech_to_text";
import { ElevenLabsConfig } from "../../../config/elevenlabs_config";

/**
 * Retrieves all ElevenLabs action instances.
 * WARNING: All new ElevenLabs action classes must be instantiated here to be discovered.
 *
 * @returns - Array of ElevenLabs action instances
 */
export function getElevenLabsActions(config?: ElevenLabsConfig): ZapAction<ZapActionSchema>[] {
  // If config is provided, ensure it's set as the instance
  if (config) {
    ElevenLabsConfig.resetInstance();
    ElevenLabsConfig.getInstance({ 
      apiKey: config.getApiKey() || undefined,
    });
  }

  return [
    new TextToSpeechAction() as unknown as ZapAction<ZapActionSchema>,
    new SpeechToTextAction() as unknown as ZapAction<ZapActionSchema>,
  ];
}

export const ELEVENLABS_ACTIONS = getElevenLabsActions();

export {
  ElevenLabsConfig,
  TextToSpeechAction,
  SpeechToTextAction,
}; 