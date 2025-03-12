import { z } from "zod";
import { ZapAction } from "../zap_action";
import { sshManager } from "./helpers/ssh_manager";
import { RemoteShellSchema, REMOTE_SHELL_PROMPT, REMOTE_SHELL_ACTION_NAME } from "../../actions_schemas/hyperbolic/remote_shell";

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
  public name = REMOTE_SHELL_ACTION_NAME;
  public description = REMOTE_SHELL_PROMPT;
  public schema = RemoteShellSchema;
  public func = (args: { [key: string]: any }) => executeRemoteCommand(args.command);
}
