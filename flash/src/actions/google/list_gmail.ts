import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../zap_action";
import { GoogleConfig } from "../../config/google_config";

// Schema for Gmail messages response
const GmailMessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  labelIds: z.array(z.string()).optional(),
  snippet: z.string().optional(),
  historyId: z.string().optional(),
  internalDate: z.string().optional(),
  payload: z.any().optional(), // Can be detailed further if needed
  sizeEstimate: z.number().optional(),
  raw: z.string().optional()
});

const GmailListResponseSchema = z.object({
  messages: z.array(GmailMessageSchema).optional(),
  nextPageToken: z.string().optional(),
  resultSizeEstimate: z.number().optional()
});

// Input schema for the list Gmail function
const ListGmailSchema = z.object({
  q: z.string().optional().describe("Gmail query string for filtering messages")
}).strict();

const LIST_GMAIL_PROMPT = `
This tool will list Gmail messages using the Gmail API.

Optional inputs:
- q: Gmail query string for filtering messages (see https://support.google.com/mail/answer/7190?hl=en)

Example queries:
- "in:inbox" - Messages in inbox
- "is:unread" - Unread messages
- "from:example@domain.com" - Messages from specific sender
- "subject:hello" - Messages with specific subject
- "after:2024/01/01" - Messages after date

Important notes:
- Requires valid Gmail API authorization token
- Returns list of messages with metadata
- Query parameter supports complex Gmail search syntax
`;

/**
 * List Gmail messages with optional query filtering
 * @param params Optional parameters including query string
 * @returns Gmail messages data or error message
 */
export async function listGmail(
  params: z.infer<typeof ListGmailSchema>
): Promise<string | z.infer<typeof GmailListResponseSchema>> {
  const config = GoogleConfig.getInstance();
  const token = config.getToken();
  
  if (!token) {
    return "failed to get mail list. error: token not found";
  }

  try {
    const response = await axios.get(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages",
      {
        params: {
          q: params.q
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Parse and validate response data
    const parsedResponse = GmailListResponseSchema.parse(response.data);
    
    // Format messages if present
    if (parsedResponse.messages) {
      // Add any additional processing or formatting here if needed
      return {
        messages: parsedResponse.messages,
        nextPageToken: parsedResponse.nextPageToken,
        resultSizeEstimate: parsedResponse.resultSizeEstimate
      };
    }

    return {
      messages: [],
      resultSizeEstimate: 0
    };

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return `failed to get mail list. error: ${errorMessage}`;
    }
    return `failed to get mail list. error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Action class for listing Gmail messages
 */
export class ListGmailAction implements ZapAction<typeof ListGmailSchema> {
  public name = "list_gmail";
  public description = LIST_GMAIL_PROMPT;
  public schema = ListGmailSchema;
  public func = async (args: { q?: string }) => {
    const result = await listGmail(args);
    return typeof result === 'string' ? result : JSON.stringify(result);
  };
}

// Type exports for use in tests
export type GoogleListGmailRequest = z.infer<typeof ListGmailSchema>;
export type GmailListResponse = z.infer<typeof GmailListResponseSchema>;