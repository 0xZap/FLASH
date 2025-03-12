import { z } from "zod";

export const GENERATE_AVATAR_VIDEO_ACTION_NAME = "generate_heygen_avatar_video";

// Schema for video dimensions
export const DimensionSchema = z.object({
    width: z.number().int().positive().describe("Video width in pixels"),
    height: z.number().int().positive().describe("Video height in pixels"),
  });
  
  // Schema for voice settings
  export const VoiceSettingsSchema = z.object({
    speed: z.number().min(0.5).max(2).optional().default(1).describe("Voice speed (0.5-2)"),
    pitch: z.number().min(-10).max(10).optional().default(0).describe("Voice pitch (-10 to 10)"),
  });
  
  // Schema for background options
  export const BackgroundSchema = z.object({
    type: z.enum(["color", "image", "video", "transparent"]).describe("Background type"),
    value: z.string().describe("Background value (color code, URL, or ID)"),
  });
  
  // Input schema for generating avatar videos
export const GenerateAvatarVideoSchema = z
    .object({
      avatar_id: z
        .string()
        .describe("The ID of the avatar to use for the video"),
      
      avatar_style: z
        .enum(["normal", "happy", "serious", "sad"])
        .default("normal")
        .describe("The style/emotion of the avatar presentation"),
      
      input_text: z
        .string()
        .min(1)
        .max(1500)
        .describe("The text for the avatar to speak (max 1500 characters)"),
      
      voice_id: z
        .string()
        .describe("The ID of the voice to use"),
      
      voice_settings: VoiceSettingsSchema
        .optional()
        .describe("Optional voice settings"),
      
      background: BackgroundSchema
        .optional()
        .describe("Optional background settings"),
      
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
  
export const GENERATE_AVATAR_VIDEO_PROMPT = `
  This tool generates videos with AI avatars using HeyGen.
  
  Required inputs:
  - avatar_id: The ID of the avatar to use (from list_heygen_avatars)
  - input_text: The text for the avatar to speak (max 1500 characters)
  - voice_id: The ID of the voice to use (from list_heygen_voices)
  
  Optional inputs:
  - avatar_style: Avatar emotion ("normal", "happy", "serious", "sad")
  - voice_settings: Object with speed (0.5-2) and pitch (-10 to 10)
  - background: Object with type and value (e.g., {"type": "color", "value": "#FAFAFA"})
  - dimension: Video dimensions (default: {"width": 1280, "height": 720})
  - wait_for_result: Whether to wait for video completion (default: false)
  
  Example usage:
  \`\`\`
  {
    "avatar_id": "Angela-inTshirt-20220820",
    "input_text": "Welcome to HeyGen! This is a demo of our avatar video technology.",
    "voice_id": "1bd001e7e50f421d891986aad5158bc8",
    "avatar_style": "happy",
    "voice_settings": {
      "speed": 1.1,
      "pitch": 0
    },
    "background": {
      "type": "color",
      "value": "#FAFAFA"
    }
  }
  \`\`\`
  `;

