import { z } from "zod";

export const CHECK_VIDEO_STATUS_ACTION_NAME = "check_video_status";

// Input schema for checking video status
export const CheckVideoStatusSchema = z
  .object({
    video_id: z
      .string()
      .describe("The ID of the video to check"),
  })
  .strict();

export const CHECK_VIDEO_STATUS_PROMPT = `
This tool checks the status of a HeyGen video generation process.

Required inputs:
- video_id: The ID of the video to check (from generate_heygen_avatar_video or generate_heygen_talking_photo_video)

The response provides the current status of the video, and if completed, the URL to access it.

Example usage:
\`\`\`
{
  "video_id": "7f6754ab-cd3e-40a4-8645-e45151c9a9b1"
}
\`\`\`
`;
