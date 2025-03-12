import { z } from "zod";

export const LIST_VOICES_ACTION_NAME = "list_heygen_voices";

export const ListVoicesSchema = z
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
    gender: z
      .enum(["female", "male"])
      .optional()
      .describe("Filter voices by gender (optional)"),
    language: z
      .string()
      .optional()
      .describe("Filter voices by language code (e.g., 'en-US', 'es-ES')"),
  })
  .strict();

export const LIST_VOICES_PROMPT = `
This tool fetches available voices from HeyGen.

Optional inputs:
- limit: Maximum number of results to return (default: 50)
- page: Page number for pagination (default: 1)
- gender: Filter voices by gender ('female' or 'male')
- language: Filter voices by language code (e.g., 'en-US', 'es-ES')

The response provides a list of voices with their IDs, names, and other details.
Use the voice_id in subsequent requests to generate videos.

Example usage:
\`\`\`
{
  "limit": 10,
  "page": 1,
  "gender": "female",
  "language": "en-US"
}
\`\`\`
`;