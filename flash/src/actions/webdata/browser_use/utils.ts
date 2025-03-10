import axios from "axios";
import { BrowserUseConfig } from "../../../config/browser_use_config";

/**
 * Creates a headers object with the Authorization header.
 * @param apiKey The API key
 * @returns Headers object
 */
export function createHeaders(apiKey: string, contentType: boolean = false): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };

  if (contentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

/**
 * Handles API errors and formats them into a user-friendly message.
 * @param error The error object
 * @returns A formatted error message
 */
export function handleApiError(error: any): string {
  if (axios.isAxiosError(error) && error.response) {
    const status = error.response.status;
    let message = `API Error (${status})`;

    if (error.response.data) {
      if (typeof error.response.data === "string") {
        message += `: ${error.response.data}`;
      } else if (error.response.data.error) {
        message += `: ${error.response.data.error}`;
      } else if (error.response.data.message) {
        message += `: ${error.response.data.message}`;
      } else {
        message += `: ${JSON.stringify(error.response.data)}`;
      }
    }

    return message;
  }

  return `Error: ${error.message || "Unknown error"}`;
}

/**
 * Gets the Browser Use API configuration.
 * @returns The configuration and API key
 * @throws Error if API key is not found
 */
export function getBrowserUseConfig(): { config: BrowserUseConfig; apiKey: string } {
  const config = BrowserUseConfig.getInstance();
  const apiKey = config.getApiKey();

  // if (!apiKey) {
  //   throw new Error("Browser Use API key not found. Please set it in your configuration or as BROWSER_USE_API_KEY environment variable.");
  // }

  return { config, apiKey: apiKey || '' };
} 