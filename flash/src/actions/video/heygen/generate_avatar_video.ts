import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../../zap_action";
import { HeyGenConfig } from "../../../config/heygen_config";
import { waitForVideoCompletion } from "./check_video_status";

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
const GenerateAvatarVideoSchema = z
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

const GENERATE_AVATAR_VIDEO_PROMPT = `
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

/**
 * Generates a video with an AI avatar using HeyGen.
 * @param params Video generation parameters
 * @returns Video ID and status information
 */
export async function generateAvatarVideo(params: z.infer<typeof GenerateAvatarVideoSchema>): Promise<string> {
  const config = HeyGenConfig.getInstance();
  const apiKey = config.getApiKey();

  if (!apiKey) {
    throw new Error("HeyGen API key not found. Please set it in your configuration or as HEYGEN_API_KEY environment variable.");
  }

  try {
    // Create the request payload
    const payload: any = {
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: params.avatar_id,
            avatar_style: params.avatar_style,
          },
          voice: {
            type: "text",
            input_text: params.input_text,
            voice_id: params.voice_id,
          },
        },
      ],
      dimension: params.dimension,
    };

    // Add voice settings if provided
    if (params.voice_settings) {
      payload.video_inputs[0].voice.speed = params.voice_settings.speed;
      payload.video_inputs[0].voice.pitch = params.voice_settings.pitch;
    }

    // Add background if provided
    if (params.background) {
      payload.video_inputs[0].background = params.background;
    }

    // Generate the video
    const response = await axios.post(
      "https://api.heygen.com/v2/video/generate",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
      }
    );

    const data = response.data;
    let result = `Successfully initiated video generation:\n`;
    result += `- Video ID: ${data.data.video_id}\n`;
    result += `- Status: ${data.data.status}\n\n`;

    // If wait_for_result is true, check status until completion or timeout
    if (params.wait_for_result) {
      result += "Waiting for video completion...\n\n";
      const videoData = await waitForVideoCompletion(data.data.video_id, apiKey);
      
      if (videoData.status === "completed") {
        result += `Video is ready!\n`;
        result += `- Video URL: ${videoData.video_url}\n`;
        result += `- Duration: ${videoData.duration} seconds\n`;
        result += `\nNote: The video URL will expire in 7 days.`;
      } else {
        result += `Video generation is ${videoData.status}.\n`;
        if (videoData.status === "failed") {
          result += `Error: ${videoData.error || "Unknown error"}\n`;
        } else {
          result += `Please check the status later using the video_id: ${data.data.video_id}\n`;
        }
      }
    } else {
      result += `To check video status later, use the video_id: ${data.data.video_id}\n`;
      result += `You can check the status using the check_heygen_video_status tool.`;
    }

    return result;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Failed to generate video: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Failed to generate video: ${error.message}`);
  }
}

/**
 * Action to generate videos with AI avatars using HeyGen.
 */
export class GenerateAvatarVideoAction implements ZapAction<typeof GenerateAvatarVideoSchema> {
  public name = "generate_heygen_avatar_video";
  public description = GENERATE_AVATAR_VIDEO_PROMPT;
  public schema = GenerateAvatarVideoSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return generateAvatarVideo({
      avatar_id: args.avatar_id,
      avatar_style: args.avatar_style || "normal",
      input_text: args.input_text,
      voice_id: args.voice_id,
      voice_settings: args.voice_settings,
      background: args.background,
      dimension: args.dimension || { width: 1280, height: 720 },
      wait_for_result: args.wait_for_result !== undefined ? args.wait_for_result : false,
    });
  };
} 