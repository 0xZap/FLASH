import { z } from "zod";

export const SSH_ACCESS_ACTION_NAME = "ssh_connect";

// Schema for SSH connection input
export const SSHAccessSchema = z
  .object({
    host: z.string().describe("Hostname or IP address of the remote server"),
    username: z.string().describe("SSH username for authentication"),
    password: z.string().optional().describe("SSH password for authentication"),
    private_key_path: z.string().optional().describe("Path to private key file"),
    port: z.number().default(22).describe("SSH port number"),
  })
  .strict();

export const SSH_ACCESS_PROMPT = `
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
