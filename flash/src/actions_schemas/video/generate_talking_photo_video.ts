import { z } from "zod";
import { DimensionSchema, VoiceSettingsSchema, BackgroundSchema } from "./generate_avatar_video";

export const GENERATE_TALKING_PHOTO_VIDEO_ACTION_NAME = "generate_heygen_talking_photo_video";
// Input schema for generating talking photo videos
export const GenerateTalkingPhotoVideoSchema = z
  .object({
    talking_photo_id: z
      .string()
      .describe("The ID of the talking photo to use"),
    
    input_text: z
      .string()
      .min(1)
      .max(1500)
      .describe("The text for the talking photo to speak (max 1500 characters)"),
    
    voice_id: z
      .string()
      .describe("The ID of the voice to use"),
    
    voice_settings: VoiceSettingsSchema
      .optional()
      .describe("Optional voice settings"),
    
    background: BackgroundSchema
      .optional()
      .default({ type: "color", value: "#FAFAFA" })
      .describe("Background settings (default: white)"),
    
    dimension: DimensionSchema
      .optional()
      .default({ width: 1280, height: 720 })
      .describe("Video dimensions (default: 1280x720)"),
    
    wait_for_result: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether to wait for video completion (may timeout for longer videos)"),
  })
  .strict();

export const GENERATE_TALKING_PHOTO_VIDEO_PROMPT = `
This tool generates videos with "Talking Photos" using HeyGen.

Required inputs:
- talking_photo_id: The ID of the talking photo to use (from upload_heygen_talking_photo)
- input_text: The text for the talking photo to speak (max 1500 characters)
- voice_id: The ID of the voice to use (from list_heygen_voices)

Optional inputs:
- voice_settings: Object with speed (0.5-2) and pitch (-10 to 10)
- background: Object with type and value (default: {"type": "color", "value": "#FAFAFA"})
- dimension: Video dimensions (default: {"width": 1280, "height": 720})
- wait_for_result: Whether to wait for video completion (default: false)

Example usage:
\`\`\`
{
  "talking_photo_id": "tp_abcdefg123456",
  "input_text": "With HeyGen, it is very easy to create talking photo videos.",
  "voice_id": "d7bbcdd6964c47bdaae26decade4a933",
  "background": {
    "type": "color",
    "value": "#FAFAFA"
  }
}
\`\`\`
`;
