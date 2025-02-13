import { z } from "zod";
import { ZapAction } from "../zap_action";
import { sshManager } from "./helpers/ssh_manager";

// Input schema for remote shell commands
const RemoteShellSchema = z
  .object({
    command: z.string().describe("The shell command to execute on the remote server"),
  })
  .strict();

const REMOTE_SHELL_PROMPT = `
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

/**
 * Execute a command on the remote server.
 * @param command The shell command to execute
 * @returns Command output or error message
 */
export async function executeRemoteCommand(command: string): Promise<string> {
  // Special command to check SSH status
  if (command.trim().toLowerCase() === "ssh_status") {
    return sshManager.getConnectionInfo();
  }

  // Verify SSH is connected before executing
  if (!sshManager.isConnected()) {
    throw new Error(
      "No active SSH connection. Please connect to a remote server first using ssh_connect.",
    );
  }

  // Execute command remotely
  return sshManager.execute(command);
}

/**
 * Action to execute remote shell commands via SSH.
 */
export class RemoteShellAction implements ZapAction<typeof RemoteShellSchema> {
  public name = "remote_shell";
  public description = REMOTE_SHELL_PROMPT;
  public schema = RemoteShellSchema;
  public func = (args: { [key: string]: any }) => executeRemoteCommand(args.command);
}
