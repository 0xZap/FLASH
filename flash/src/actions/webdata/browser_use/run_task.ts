import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../../zap_action";
import { getBrowserUseConfig, createHeaders, handleApiError } from "./utils";

// Input schema for running a Browser Use task
const RunTaskSchema = z
  .object({
    task: z
      .string()
      .min(1)
      .describe("The task description for Browser Use to execute"),
    
    save_browser_data: z
      .boolean()
      .optional()
      .default(true)
      .describe("Whether to save browser data (cookies, local storage, etc.)"),
  })
  .strict();

const RUN_TASK_PROMPT = `
This tool runs a new task on Browser Use, which allows automation of browser-based tasks.

Required inputs:
- task: A description of the task to execute (e.g., "Go to example.com and extract all links on the homepage")

Optional inputs:
- save_browser_data: Whether to save browser data like cookies (default: true)

The response includes task ID, status, and a live URL to watch the task execution in real-time.

Example usage:
\`\`\`
{
  "task": "Go to github.com, search for 'browser automation', and collect the top 5 repositories with their star counts"
}
\`\`\`
`;

/**
 * Runs a task on Browser Use.
 * @param params The task parameters
 * @returns Information about the created task
 */
export async function runTask(params: z.infer<typeof RunTaskSchema>): Promise<string> {
  const { config, apiKey } = getBrowserUseConfig();
  
  try {
    const response = await axios.post(
      `${config.getBaseUrl()}/run-task`,
      {
        task: params.task,
        save_browser_data: params.save_browser_data,
      },
      {
        headers: createHeaders(apiKey, true),
      }
    );

    const data = response.data;
    
    if (!data || typeof data !== 'object') {
      return "Task started, but no detailed information was returned.";
    }
    
    let result = `Successfully started Browser Use task:\n`;
    
    if (data.id) {
      result += `- Task ID: ${data.id}\n`;
    }
    
    if (data.status) {
      result += `- Status: ${data.status}\n`;
    }
    
    if (data.live_url) {
      result += `- Live URL: ${data.live_url}\n`;
      result += `\nYou can watch the task execution in real-time at the Live URL.`;
    }
    
    result += `\n\nTo check the task status later, use the get_browser_use_task tool with the Task ID.`;
    
    return result;
  } catch (error: any) {
    throw new Error(`Failed to run Browser Use task: ${handleApiError(error)}`);
  }
}

/**
 * Action to run a Browser Use task.
 */
export class RunTaskAction implements ZapAction<typeof RunTaskSchema> {
  public name = "run_browser_use_task";
  public description = RUN_TASK_PROMPT;
  public schema = RunTaskSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return runTask({
      task: args.task,
      save_browser_data: args.save_browser_data !== undefined ? args.save_browser_data : true,
    });
  };
} 