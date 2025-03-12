import { z } from "zod";

export const UPLOAD_TALKING_PHOTO_ACTION_NAME = "upload_heygen_talking_photo";



export const UploadTalkingPhotoSchema = z
  .object({
    photo_url: z
      .string()
      .url()
      .describe("The URL of the photo to upload"),
    
    content_type: z
      .enum(["image/jpeg", "image/png"])
      .default("image/jpeg")
      .describe("Content type of the image (default: image/jpeg)"),
  })
  .strict();

export const UPLOAD_TALKING_PHOTO_PROMPT = `
This tool uploads a photo to HeyGen to create a "Talking Photo" that can be animated.

Required inputs:
- photo_url: The URL of the photo to upload

Optional inputs:
- content_type: Content type of the image ("image/jpeg" or "image/png", default: "image/jpeg")

The photo should meet these requirements:
- The face is intact and clearly visible
- Recommend using real human faces
- Only one face shows in the photo
- The resolution of the face area is larger than 200x200 pixels

Example usage:
\`\`\`
{
  "photo_url": "https://example.com/photo.jpg",
  "content_type": "image/jpeg"
}
\`\`\`
`;