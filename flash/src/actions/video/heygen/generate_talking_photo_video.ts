import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../../zap_action";
import { HeyGenConfig } from "../../../config/heygen_config";
import { DimensionSchema, VoiceSettingsSchema, BackgroundSchema } from "./generate_avatar_video";
import { waitForVideoCompletion } from "./check_video_status";

// Input schema for generating talking photo videos
const GenerateTalkingPhotoVideoSchema = z
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

const GENERATE_TALKING_PHOTO_VIDEO_PROMPT = `
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

/**
 * Generates a video with a talking photo using HeyGen.
 * @param params Video generation parameters
 * @returns Video ID and status information
 */
export async function generateTalkingPhotoVideo(params: z.infer<typeof GenerateTalkingPhotoVideoSchema>): Promise<string> {
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
            type: "talking_photo",
            talking_photo_id: params.talking_photo_id,
          },
          voice: {
            type: "text",
            input_text: params.input_text,
            voice_id: params.voice_id,
          },
          background: params.background,
        },
      ],
      dimension: params.dimension,
    };

    // Add voice settings if provided
    if (params.voice_settings) {
      payload.video_inputs[0].voice.speed = params.voice_settings.speed;
      payload.video_inputs[0].voice.pitch = params.voice_settings.pitch;
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
    let result = `Successfully initiated talking photo video generation:\n`;
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
      throw new Error(`Failed to generate talking photo video: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Failed to generate talking photo video: ${error.message}`);
  }
}

/**
 * Action to generate videos with Talking Photos using HeyGen.
 */
export class GenerateTalkingPhotoVideoAction implements ZapAction<typeof GenerateTalkingPhotoVideoSchema> {
  public name = "generate_heygen_talking_photo_video";
  public description = GENERATE_TALKING_PHOTO_VIDEO_PROMPT;
  public schema = GenerateTalkingPhotoVideoSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return generateTalkingPhotoVideo({
      talking_photo_id: args.talking_photo_id,
      input_text: args.input_text,
      voice_id: args.voice_id,
      voice_settings: args.voice_settings,
      background: args.background || { type: "color", value: "#FAFAFA" },
      dimension: args.dimension || { width: 1280, height: 720 },
      wait_for_result: args.wait_for_result !== undefined ? args.wait_for_result : false,
    });
  };
} 