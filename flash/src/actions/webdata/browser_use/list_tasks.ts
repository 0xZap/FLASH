import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../../zap_action";
import { getBrowserUseConfig, createHeaders, handleApiError } from "./utils";

// Input schema for listing tasks
const ListTasksSchema = z
  .object({
    limit: z
      .number()
      .int()
      .positive()
      .max(100)
      .optional()
      .describe("Maximum number of tasks to return (max 100)"),
    offset: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("Number of tasks to skip"),
    status: z
      .enum(["created", "running", "paused", "completed", "failed", "stopped"])
      .optional()
      .describe("Filter tasks by status"),
  })
  .strict();

const LIST_TASKS_PROMPT = `
This tool lists Browser Use tasks, with options for pagination and filtering.

Optional inputs:
- limit: Maximum number of tasks to return (default: 10, max: 100)
- offset: Number of tasks to skip for pagination (default: 0)
- status: Filter tasks by status ("created", "running", "paused", "completed", "failed", "stopped")

The response includes basic details about each task.

Example usage:
\`\`\`
{
  "limit": 5,
  "status": "completed"
}
\`\`\`
`;

/**
 * Lists Browser Use tasks with pagination and filtering.
 * @param params The list parameters
 * @returns List of tasks
 */
export async function listTasks(params: z.infer<typeof ListTasksSchema>): Promise<string> {
  const { config, apiKey } = getBrowserUseConfig();
  
  try {
    // Build query params
    const queryParams = new URLSearchParams();
    if (params.limit !== undefined) {
      queryParams.append("limit", params.limit.toString());
    }
    if (params.offset !== undefined) {
      queryParams.append("offset", params.offset.toString());
    }
    if (params.status !== undefined) {
      queryParams.append("status", params.status);
    }
    
    // Construct URL with query params
    const url = `${config.getBaseUrl()}/tasks${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await axios.get(
      url,
      {
        headers: createHeaders(apiKey),
      }
    );

    const data = response.data;
    
    if (!data || !Array.isArray(data)) {
      return "No tasks were returned or invalid response format.";
    }
    
    if (data.length === 0) {
      return "No tasks found matching the criteria.";
    }
    
    let result = `Found ${data.length} tasks:\n\n`;
    
    data.forEach((task: any, index: number) => {
      result += `--- Task ${index + 1} ---\n`;
      
      if (task.id) {
        result += `ID: ${task.id}\n`;
      }
      
      if (task.task) {
        // Truncate long task descriptions
        const taskDescription = task.task.length > 100 
          ? task.task.substring(0, 97) + "..." 
          : task.task;
        result += `Description: ${taskDescription}\n`;
      }
      
      if (task.status) {
        result += `Status: ${task.status}\n`;
      }
      
      if (task.created_at) {
        result += `Created: ${task.created_at}\n`;
      }
      
      if (task.live_url) {
        result += `Live URL: ${task.live_url}\n`;
      }
      
      result += "\n";
    });
    
    return result;
  } catch (error: any) {
    throw new Error(`Failed to list tasks: ${handleApiError(error)}`);
  }
}

/**
 * Action to list Browser Use tasks.
 */
export class ListTasksAction implements ZapAction<typeof ListTasksSchema> {
  public name = "list_browser_use_tasks";
  public description = LIST_TASKS_PROMPT;
  public schema = ListTasksSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return listTasks({
      limit: args.limit,
      offset: args.offset,
      status: args.status,
    });
  };
} 