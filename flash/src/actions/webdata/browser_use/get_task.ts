import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../../zap_action";
import { getBrowserUseConfig, createHeaders, handleApiError } from "./utils";

// Input schema for getting task information
const GetTaskSchema = z
  .object({
    task_id: z
      .string()
      .min(1)
      .describe("The ID of the task to retrieve"),
  })
  .strict();

// --- GET TASK ---

const GET_TASK_PROMPT = `
This tool retrieves detailed information about a Browser Use task.

Required inputs:
- task_id: The ID of the task to retrieve

The response includes task details such as status, progress, output, and browser data.

Example usage:
\`\`\`
{
  "task_id": "1a2b3c4d5e6f"
}
\`\`\`
`;

/**
 * Gets information about a Browser Use task.
 * @param params The task parameters
 * @returns Detailed task information
 */
export async function getTask(params: z.infer<typeof GetTaskSchema>): Promise<string> {
  const { config, apiKey } = getBrowserUseConfig();
  
  try {
    const response = await axios.get(
      `${config.getBaseUrl()}/task/${params.task_id}`,
      {
        headers: createHeaders(apiKey),
      }
    );

    const data = response.data;
    
    if (!data || typeof data !== 'object') {
      return "No task information was returned.";
    }
    
    let result = `Task Information:\n`;
    
    if (data.id) {
      result += `- Task ID: ${data.id}\n`;
    }
    
    if (data.task) {
      result += `- Task Description: ${data.task}\n`;
    }
    
    if (data.status) {
      result += `- Status: ${data.status}\n`;
    }
    
    if (data.created_at) {
      result += `- Created At: ${data.created_at}\n`;
    }
    
    if (data.finished_at) {
      result += `- Finished At: ${data.finished_at}\n`;
    }
    
    if (data.live_url) {
      result += `- Live URL: ${data.live_url}\n`;
    }
    
    // Add output if available
    if (data.output) {
      result += `\nOutput:\n${data.output}\n`;
    }
    
    // Add steps if available
    if (data.steps && Array.isArray(data.steps) && data.steps.length > 0) {
      result += `\nSteps:\n`;
      data.steps.forEach((step: any, index: number) => {
        result += `Step ${index + 1}:\n`;
        if (step.evaluation_previous_goal) {
          result += `- Previous Goal Evaluation: ${step.evaluation_previous_goal}\n`;
        }
        if (step.next_goal) {
          result += `- Next Goal: ${step.next_goal}\n`;
        }
        result += `\n`;
      });
    }
    
    // Add browser data summary if available
    if (data.browser_data && typeof data.browser_data === 'object') {
      result += `\nBrowser Data:\n`;
      
      if (data.browser_data.cookies && Array.isArray(data.browser_data.cookies)) {
        result += `- Cookies: ${data.browser_data.cookies.length} cookies stored\n`;
      }
      
      // Add other browser data types as they become available
    }
    
    return result;
  } catch (error: any) {
    throw new Error(`Failed to get task information: ${handleApiError(error)}`);
  }
}

/**
 * Action to get Browser Use task information.
 */
export class GetTaskAction implements ZapAction<typeof GetTaskSchema> {
  public name = "get_browser_use_task";
  public description = GET_TASK_PROMPT;
  public schema = GetTaskSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return getTask({
      task_id: args.task_id,
    });
  };
}

// --- GET TASK STATUS ---

const GET_TASK_STATUS_PROMPT = `
This tool retrieves the current status of a Browser Use task.

Required inputs:
- task_id: The ID of the task to check

The response is a simple status string (e.g., "created", "running", "completed", "failed").

Example usage:
\`\`\`
{
  "task_id": "1a2b3c4d5e6f"
}
\`\`\`
`;

/**
 * Gets the status of a Browser Use task.
 * @param params The task parameters
 * @returns Task status
 */
export async function getTaskStatus(params: z.infer<typeof GetTaskSchema>): Promise<string> {
  const { config, apiKey } = getBrowserUseConfig();
  
  try {
    const response = await axios.get(
      `${config.getBaseUrl()}/task/${params.task_id}/status`,
      {
        headers: createHeaders(apiKey),
      }
    );

    const data = response.data;
    
    if (typeof data === 'string') {
      return `Task Status: ${data}`;
    } else if (data && typeof data === 'object' && data.status) {
      return `Task Status: ${data.status}`;
    } else {
      return `Task Status: Unknown (received: ${JSON.stringify(data)})`;
    }
  } catch (error: any) {
    throw new Error(`Failed to get task status: ${handleApiError(error)}`);
  }
}

/**
 * Action to get Browser Use task status.
 */
export class GetTaskStatusAction implements ZapAction<typeof GetTaskSchema> {
  public name = "get_browser_use_task_status";
  public description = GET_TASK_STATUS_PROMPT;
  public schema = GetTaskSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return getTaskStatus({
      task_id: args.task_id,
    });
  };
}

// --- GET TASK MEDIA ---

const GET_TASK_MEDIA_PROMPT = `
This tool retrieves media files (recordings) associated with a Browser Use task.

Required inputs:
- task_id: The ID of the task to retrieve media for

The response includes URLs to recordings or other media files generated during the task.

Example usage:
\`\`\`
{
  "task_id": "1a2b3c4d5e6f"
}
\`\`\`
`;

/**
 * Gets media files associated with a Browser Use task.
 * @param params The task parameters
 * @returns Media information
 */
export async function getTaskMedia(params: z.infer<typeof GetTaskSchema>): Promise<string> {
  const { config, apiKey } = getBrowserUseConfig();
  
  try {
    const response = await axios.get(
      `${config.getBaseUrl()}/task/${params.task_id}/media`,
      {
        headers: createHeaders(apiKey),
      }
    );

    const data = response.data;
    
    if (!data || typeof data !== 'object') {
      return "No media information was returned.";
    }
    
    let result = `Task Media:\n`;
    
    if (data.recordings && Array.isArray(data.recordings)) {
      if (data.recordings.length === 0) {
        result += "No recordings available for this task.";
      } else {
        result += `Found ${data.recordings.length} recording(s):\n\n`;
        data.recordings.forEach((recording: string, index: number) => {
          result += `${index + 1}. ${recording}\n`;
        });
      }
    } else {
      result += "No recording information available.";
    }
    
    return result;
  } catch (error: any) {
    throw new Error(`Failed to get task media: ${handleApiError(error)}`);
  }
}

/**
 * Action to get Browser Use task media.
 */
export class GetTaskMediaAction implements ZapAction<typeof GetTaskSchema> {
  public name = "get_browser_use_task_media";
  public description = GET_TASK_MEDIA_PROMPT;
  public schema = GetTaskSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return getTaskMedia({
      task_id: args.task_id,
    });
  };
} 