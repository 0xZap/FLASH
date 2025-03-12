import { z } from "zod";
import { ZapAction } from "../zap_action";
import { SSHManager } from "./helpers/ssh_manager";
import { SSHAccessSchema, SSH_ACCESS_PROMPT, SSH_ACCESS_ACTION_NAME } from "../../actions_schemas/hyperbolic/ssh_access";

/**
 * Establish SSH connection to remote server.
 * @param params Connection parameters
 * @returns Connection status message
 */
export async function connectSSH(params: z.infer<typeof SSHAccessSchema>): Promise<string> {
  const sshManager = SSHManager.getInstance();

  try {
    const { host, username, password, private_key_path, port } = params;

    // Use environment variable for private key if not provided
    const keyPath = private_key_path || process.env.SSH_PRIVATE_KEY_PATH;

    return await sshManager.connect(host, username, password, keyPath, port);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`SSH connection failed: ${error.message}`);
    }
    throw new Error("SSH connection failed");
  }
}

/**
 * Action to establish SSH connection to remote server.
 */
export class SSHAccessAction implements ZapAction<typeof SSHAccessSchema> {
  public name = SSH_ACCESS_ACTION_NAME;
  public description = SSH_ACCESS_PROMPT;
  public schema = SSHAccessSchema;
  public func = (args: { [key: string]: any }) =>
    connectSSH({
      host: args.host,
      username: args.username,
      port: args.port,
      password: args.password,
      private_key_path: args.private_key_path,
    });
}
