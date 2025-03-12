import { z } from "zod";

export const REMOTE_SHELL_ACTION_NAME = "remote_shell";

export const RemoteShellSchema = z
  .object({
    command: z.string().describe("The shell command to execute on the remote server"),
  })
  .strict();

export const REMOTE_SHELL_PROMPT = `
Execute shell commands on the remote server via SSH.

Input parameters:
- command: The shell command to execute on the remote server

Important notes:
- Requires an active SSH connection (use ssh_connect first)
- Use 'ssh_status' to check current connection status
- Commands are executed in the connected SSH session
- Returns command output as a string
- You can install any packages you need on the remote server
`;
