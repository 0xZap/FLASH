import { Client } from "ssh2";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export class SSHManager {
  private static _instance: SSHManager;
  private _sshClient: Client | null = null;
  private _connected: boolean = false;
  private _host: string | null = null;
  private _username: string | null = null;

  private constructor() {}

  public static getInstance(): SSHManager {
    if (!SSHManager._instance) {
      SSHManager._instance = new SSHManager();
    }
    return SSHManager._instance;
  }

  public isConnected(): boolean {
    if (this._sshClient && this._connected) {
      try {
        // Note: In real implementation, you might want to use a more robust check
        this.execute("echo 1");
        return true;
      } catch {
        this._connected = false;
      }
    }
    return false;
  }

  public async connect(
    host: string,
    username: string,
    password?: string,
    privateKeyPath?: string,
    port: number = 22,
  ): Promise<string> {
    try {
      // Close existing connection if any
      await this.disconnect();

      // Initialize new client
      this._sshClient = new Client();

      // Get default key path
      const defaultKeyPath =
        process.env.SSH_PRIVATE_KEY_PATH || path.join(os.homedir(), ".ssh", "id_rsa");

      return new Promise((resolve, reject) => {
        const config: any = {
          host,
          port,
          username,
        };

        if (password) {
          config.password = password;
        } else {
          const keyPath = privateKeyPath || defaultKeyPath;
          if (!fs.existsSync(keyPath)) {
            reject(`SSH Key Error: Key file not found at ${keyPath}`);
            return;
          }
          config.privateKey = fs.readFileSync(keyPath);
        }

        this._sshClient!.on("ready", () => {
          this._connected = true;
          this._host = host;
          this._username = username;
          resolve(`Successfully connected to ${host} as ${username}`);
        })
          .on("error", err => {
            this._connected = false;
            reject(`SSH Connection Error: ${err.message}`);
          })
          .connect(config);
      });
    } catch (e) {
      this._connected = false;
      return `SSH Connection Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  public async execute(command: string): Promise<string> {
    if (!this.isConnected()) {
      return "Error: No active SSH connection. Please connect first.";
    }

    return new Promise((resolve, reject) => {
      this._sshClient!.exec(command, (err, stream) => {
        if (err) {
          this._connected = false;
          reject(`SSH Command Error: ${err.message}`);
          return;
        }

        let output = "";
        let errorOutput = "";

        stream
          .on("data", (data: Buffer) => {
            output += data.toString();
          })
          .stderr.on("data", (data: Buffer) => {
            errorOutput += data.toString();
          })
          .on("close", () => {
            if (errorOutput) {
              resolve(`Error: ${errorOutput}\nOutput: ${output}`);
            } else {
              resolve(output);
            }
          });
      });
    });
  }

  public async disconnect(): Promise<void> {
    if (this._sshClient) {
      try {
        this._sshClient.end();
      } catch {
        // Ignore errors during disconnect
      }
    }
    this._connected = false;
    this._host = null;
    this._username = null;
  }

  public getConnectionInfo(): string {
    if (this.isConnected()) {
      return `Connected to ${this._host} as ${this._username}`;
    }
    return "Not connected";
  }
}

// Global instance
export const sshManager = SSHManager.getInstance();
