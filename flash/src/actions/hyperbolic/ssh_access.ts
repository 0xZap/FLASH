import { z } from "zod";
import { ZapAction } from "../zap_action";
import { SSHManager } from "./helpers/ssh_manager";

// Schema for SSH connection input
const SSHAccessSchema = z
  .object({
    host: z.string().describe("Hostname or IP address of the remote server"),
    username: z.string().describe("SSH username for authentication"),
    password: z.string().optional().describe("SSH password for authentication"),
    private_key_path: z.string().optional().describe("Path to private key file"),
    port: z.number().default(22).describe("SSH port number"),
  })
  .strict();

const SSH_ACCESS_PROMPT = `
This tool will establish an SSH connection to a remote server. Once connected, all shell commands will automatically run on this server.

Input parameters:
- host: The hostname or IP address of the remote server
- username: SSH username for authentication
- password: SSH password for authentication (optional if using key)
- private_key_path: Path to private key file (optional, uses SSH_PRIVATE_KEY_PATH from environment if not provided)
- port: SSH port number (default: 22)

Important notes:
- After connecting, use the 'remote_shell' tool to execute commands on the server
- Use 'ssh_status' command to check connection status
- Connection remains active until explicitly disconnected or script ends
`;

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
  public name = "ssh_connect";
  public description = SSH_ACCESS_PROMPT;
  public schema = SSHAccessSchema;
  public func = (args: { [key: string]: any }) => connectSSH({
    host: args.host,
    username: args.username,
    port: args.port,
    password: args.password,
    private_key_path: args.private_key_path
  });
}
