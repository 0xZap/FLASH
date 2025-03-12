import { z } from "zod";

export const LIST_AVATARS_ACTION_NAME = "list_heygen_avatars";

export const ListAvatarsSchema = z
  .object({
    limit: z
      .number()
      .int()
      .positive()
      .optional()
      .default(50)
      .describe("Maximum number of results to return (default: 50)"),
    page: z
      .number()
      .int()
      .positive()
      .optional()
      .default(1)
      .describe("Page number for pagination (default: 1)"),
  })
  .strict();

export const LIST_AVATARS_PROMPT = `
This tool fetches available avatars from HeyGen, including instant avatars.

Optional inputs:
- limit: Maximum number of results to return (default: 50)
- page: Page number for pagination (default: 1)

The response provides a list of avatars with their IDs, names, and other details.
Use the avatar_id in subsequent requests to generate videos.

Example usage:
\`\`\`
{
  "limit": 10,
  "page": 1
}
\`\`\`
`;

