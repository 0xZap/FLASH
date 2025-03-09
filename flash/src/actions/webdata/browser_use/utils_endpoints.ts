import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../../zap_action";
import { getBrowserUseConfig, createHeaders, handleApiError } from "./utils";

// --- CHECK BALANCE ---

const CHECK_BALANCE_PROMPT = `
This tool checks the current account balance for Browser Use.

No input parameters required.

The response includes information about remaining credits and usage.

Example usage:
\`\`\`
{}
\`\`\`
`;

// Empty schema as no parameters needed
const EmptySchema = z.object({}).strict();

/**
 * Checks the current account balance for Browser Use.
 * @returns Balance information
 */
export async function checkBalance(): Promise<string> {
  const { config, apiKey } = getBrowserUseConfig();
  
  try {
    const response = await axios.get(
      `${config.getBaseUrl()}/balance`,
      {
        headers: createHeaders(apiKey),
      }
    );

    const data = response.data;
    
    if (!data || typeof data !== 'object') {
      return "No balance information was returned.";
    }
    
    let result = `Account Balance:\n`;
    
    if (data.credits !== undefined) {
      result += `- Total Credits: ${data.credits}\n`;
    }
    
    if (data.used_credits !== undefined) {
      result += `- Used Credits: ${data.used_credits}\n`;
    }
    
    if (data.credits !== undefined && data.used_credits !== undefined) {
      const remaining = data.credits - data.used_credits;
      result += `- Remaining Credits: ${remaining}\n`;
    }
    
    if (data.plan) {
      result += `- Plan: ${data.plan}\n`;
    }
    
    return result;
  } catch (error: any) {
    throw new Error(`Failed to check balance: ${handleApiError(error)}`);
  }
}

/**
 * Action to check Browser Use account balance.
 */
export class CheckBalanceAction implements ZapAction<typeof EmptySchema> {
  public name = "check_browser_use_balance";
  public description = CHECK_BALANCE_PROMPT;
  public schema = EmptySchema;

  public func = (): Promise<string> => {
    return checkBalance();
  };
}

// --- GET USER INFO (ME) ---

const GET_USER_INFO_PROMPT = `
This tool retrieves information about the current user's Browser Use account.

No input parameters required.

The response includes details about the user's account and settings.

Example usage:
\`\`\`
{}
\`\`\`
`;

/**
 * Gets information about the current user's Browser Use account.
 * @returns User information
 */
export async function getUserInfo(): Promise<string> {
  const { config, apiKey } = getBrowserUseConfig();
  
  try {
    const response = await axios.get(
      `${config.getBaseUrl()}/me`,
      {
        headers: createHeaders(apiKey),
      }
    );

    const data = response.data;
    
    if (!data || typeof data !== 'object') {
      return "No user information was returned.";
    }
    
    let result = `User Information:\n`;
    
    if (data.id) {
      result += `- User ID: ${data.id}\n`;
    }
    
    if (data.email) {
      result += `- Email: ${data.email}\n`;
    }
    
    if (data.created_at) {
      result += `- Account Created: ${data.created_at}\n`;
    }
    
    if (data.plan) {
      result += `- Plan: ${data.plan}\n`;
    }
    
    // Add more user information fields as they become available
    
    return result;
  } catch (error: any) {
    throw new Error(`Failed to get user information: ${handleApiError(error)}`);
  }
}

/**
 * Action to get Browser Use user information.
 */
export class GetUserInfoAction implements ZapAction<typeof EmptySchema> {
  public name = "get_browser_use_user_info";
  public description = GET_USER_INFO_PROMPT;
  public schema = EmptySchema;

  public func = (): Promise<string> => {
    return getUserInfo();
  };
}

// --- PING ---

const PING_PROMPT = `
This tool pings the Browser Use API to check if it's functioning properly.

No input parameters required.

The response is a simple message indicating the API is operational.

Example usage:
\`\`\`
{}
\`\`\`
`;

/**
 * Pings the Browser Use API to check if it's functioning properly.
 * @returns Ping response
 */
export async function ping(): Promise<string> {
  const { config, apiKey } = getBrowserUseConfig();
  
  try {
    const response = await axios.get(
      `${config.getBaseUrl()}/ping`,
      {
        headers: createHeaders(apiKey),
      }
    );

    const data = response.data;
    
    if (typeof data === 'string') {
      return `Ping Response: ${data}`;
    } else if (data && typeof data === 'object') {
      if (data.status === 'ok' || data.message === 'pong') {
        return "API Status: Online";
      } else {
        return `API Response: ${JSON.stringify(data)}`;
      }
    } else {
      return "API Status: Received response but format is unexpected";
    }
  } catch (error: any) {
    throw new Error(`Failed to ping API: ${handleApiError(error)}`);
  }
}

/**
 * Action to ping the Browser Use API.
 */
export class PingAction implements ZapAction<typeof EmptySchema> {
  public name = "ping_browser_use_api";
  public description = PING_PROMPT;
  public schema = EmptySchema;

  public func = (): Promise<string> => {
    return ping();
  };
} 