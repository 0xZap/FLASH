import { z } from "zod";
import axios from "axios";
import { ZapAction } from "../../zap_action";
import { getBrowserUseConfig, createHeaders, handleApiError } from "./utils";

// Input schema for task control operations
const TaskControlSchema = z
  .object({
    task_id: z
      .string()
      .min(1)
      .describe("The ID of the task to control"),
  })
  .strict();

// Common function for task control operations
async function controlTask(action: "stop" | "pause" | "resume", taskId: string): Promise<string> {
  const { config, apiKey } = getBrowserUseConfig();
  
  try {
    const response = await axios.put(
      `${config.getBaseUrl()}/${action}-task`,
      null,
      {
        headers: createHeaders(apiKey),
      }
    );

    // Handle the response
    return `Successfully ${action}ed task ${taskId}.`;
  } catch (error: any) {
    throw new Error(`Failed to ${action} task: ${handleApiError(error)}`);
  }
}

// --- STOP TASK ---

const STOP_TASK_PROMPT = `
This tool stops a running Browser Use task.

Required inputs:
- task_id: The ID of the task to stop

Example usage:
\`\`\`
{
  "task_id": "1a2b3c4d5e6f"
}
\`\`\`
`;

/**
 * Stops a Browser Use task.
 * @param params The task parameters
 * @returns Status of the operation
 */
export async function stopTask(params: z.infer<typeof TaskControlSchema>): Promise<string> {
  return controlTask("stop", params.task_id);
}

/**
 * Action to stop a Browser Use task.
 */
export class StopTaskAction implements ZapAction<typeof TaskControlSchema> {
  public name = "stop_browser_use_task";
  public description = STOP_TASK_PROMPT;
  public schema = TaskControlSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return stopTask({
      task_id: args.task_id,
    });
  };
}

// --- PAUSE TASK ---

const PAUSE_TASK_PROMPT = `
This tool pauses a running Browser Use task.

Required inputs:
- task_id: The ID of the task to pause

Example usage:
\`\`\`
{
  "task_id": "1a2b3c4d5e6f"
}
\`\`\`
`;

/**
 * Pauses a Browser Use task.
 * @param params The task parameters
 * @returns Status of the operation
 */
export async function pauseTask(params: z.infer<typeof TaskControlSchema>): Promise<string> {
  return controlTask("pause", params.task_id);
}

/**
 * Action to pause a Browser Use task.
 */
export class PauseTaskAction implements ZapAction<typeof TaskControlSchema> {
  public name = "pause_browser_use_task";
  public description = PAUSE_TASK_PROMPT;
  public schema = TaskControlSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return pauseTask({
      task_id: args.task_id,
    });
  };
}

// --- RESUME TASK ---

const RESUME_TASK_PROMPT = `
This tool resumes a paused Browser Use task.

Required inputs:
- task_id: The ID of the task to resume

Example usage:
\`\`\`
{
  "task_id": "1a2b3c4d5e6f"
}
\`\`\`
`;

/**
 * Resumes a Browser Use task.
 * @param params The task parameters
 * @returns Status of the operation
 */
export async function resumeTask(params: z.infer<typeof TaskControlSchema>): Promise<string> {
  return controlTask("resume", params.task_id);
}

/**
 * Action to resume a Browser Use task.
 */
export class ResumeTaskAction implements ZapAction<typeof TaskControlSchema> {
  public name = "resume_browser_use_task";
  public description = RESUME_TASK_PROMPT;
  public schema = TaskControlSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return resumeTask({
      task_id: args.task_id,
    });
  };
} 