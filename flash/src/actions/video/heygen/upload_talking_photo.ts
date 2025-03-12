import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../../zap_action";
import { HeyGenConfig } from "../../../config/heygen_config";
import { UPLOAD_TALKING_PHOTO_ACTION_NAME, UploadTalkingPhotoSchema, UPLOAD_TALKING_PHOTO_PROMPT } from "../../../actions_schemas/video/upload_talking_photo";

/**
 * Uploads a photo to create a HeyGen Talking Photo.
 * @param params Upload parameters
 * @returns The talking photo ID
 */
export async function uploadTalkingPhoto(params: z.infer<typeof UploadTalkingPhotoSchema>): Promise<string> {
  const config = HeyGenConfig.getInstance();
  const apiKey = config.getApiKey();

  if (!apiKey) {
    throw new Error("HeyGen API key not found. Please set it in your configuration or as HEYGEN_API_KEY environment variable.");
  }

  try {
    // First, download the image from the URL
    const imageResponse = await axios.get(params.photo_url, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);

    // Now upload the image to HeyGen
    const response = await axios.post(
      "https://upload.heygen.com/v1/talking_photo",
      imageBuffer,
      {
        headers: {
          "X-Api-Key": apiKey,
          "Content-Type": params.content_type,
        },
      }
    );

    const data = response.data;
    let result = `Successfully uploaded talking photo:\n`;
    result += `- Talking Photo ID: ${data.data.talking_photo_id}\n`;
    
    if (data.data.status) {
      result += `- Status: ${data.data.status}\n`;
    }
    
    // Add instructions for using the talking photo ID
    result += `\nTo create a video with this talking photo, use the generate_heygen_talking_photo_video tool with this talking_photo_id.`;

    return result;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Failed to upload talking photo: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Failed to upload talking photo: ${error.message}`);
  }
}

/**
 * Action to upload a talking photo to HeyGen.
 */
export class UploadTalkingPhotoAction implements ZapAction<typeof UploadTalkingPhotoSchema> {
  public name = UPLOAD_TALKING_PHOTO_ACTION_NAME;
  public description = UPLOAD_TALKING_PHOTO_PROMPT;
  public schema = UploadTalkingPhotoSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return uploadTalkingPhoto({
      photo_url: args.photo_url,
      content_type: args.content_type || "image/jpeg",
    });
  };
} 