import { z } from "zod";

export const LIST_GMAIL_ACTION_NAME = "list_gmail";

// Schema for Gmail messages response
export const GmailMessageSchema = z.object({
    id: z.string(),
    threadId: z.string(),
    labelIds: z.array(z.string()).optional(),
    snippet: z.string().optional(),
    historyId: z.string().optional(),
    internalDate: z.string().optional(),
    payload: z.any().optional(), // Can be detailed further if needed
    sizeEstimate: z.number().optional(),
    raw: z.string().optional(),
  });
  
  export const GmailListResponseSchema = z.object({
    messages: z.array(GmailMessageSchema).optional(),
    nextPageToken: z.string().optional(),
    resultSizeEstimate: z.number().optional(),
  });
  
  // Input schema for the list Gmail function
  export const ListGmailSchema = z
    .object({
      q: z.string().optional().describe("Gmail query string for filtering messages"),
    })
    .strict();
  
  export const LIST_GMAIL_PROMPT = `
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