import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { executeRemoteCommand, RemoteShellAction } from "../actions/hyperbolic/remote_shell";
import { sshManager } from "../actions/hyperbolic/helpers/ssh_manager";

// Update the mock to define isConnected as a method
jest.mock("../actions/hyperbolic/helpers/ssh_manager", () => ({
  sshManager: {
    isConnected: jest.fn() as jest.MockedFunction<() => boolean>,
    execute: jest.fn() as jest.MockedFunction<() => Promise<string>>,
    getConnectionInfo: jest.fn() as jest.MockedFunction<() => Promise<string>>,
  },
}));

class RemoteShellTest {
  beforeEach() {
    jest.clearAllMocks();
  }

  async testExecuteRemoteCommand() {
    // ... existing test logic ...
  }

  // ... other test methods
}

describe("Remote Shell", () => {
  const testInstance = new RemoteShellTest();

  beforeEach(() => testInstance.beforeEach());

  describe("executeRemoteCommand", () => {
    it("should throw error when SSH is not connected", async () => {
      // Update to mock method instead of property
      (sshManager.isConnected as jest.Mock).mockReturnValue(false);

      await expect(executeRemoteCommand("ls")).rejects.toThrow(
        "No active SSH connection. Please connect to a remote server first using ssh_connect.",
      );
    });

    it("should return connection info for ssh_status command", async () => {
      const mockConnectionInfo = "Connected to: test-server";
      jest.spyOn(sshManager, "getConnectionInfo").mockResolvedValue(mockConnectionInfo as never);

      const result = await executeRemoteCommand("ssh_status");
      expect(result).toBe(mockConnectionInfo);
      expect(sshManager.getConnectionInfo).toHaveBeenCalled();
    });

    it("should execute command successfully when SSH is connected", async () => {
      // Update to mock method instead of property
      (sshManager.isConnected as jest.Mock).mockReturnValue(true);
      const mockOutput = "Command output";
      jest.spyOn(sshManager, "execute").mockResolvedValue(mockOutput);

      const result = await executeRemoteCommand("ls -la");
      expect(result).toBe(mockOutput);
      expect(sshManager.execute).toHaveBeenCalledWith("ls -la");
    });

    it("should handle command execution errors", async () => {
      // Update to mock method instead of property
      (sshManager.isConnected as jest.Mock).mockReturnValue(true);
      const errorMessage = "Command execution failed";
      jest.spyOn(sshManager, "execute").mockRejectedValue(new Error(errorMessage));

      await expect(executeRemoteCommand("invalid-command")).rejects.toThrow(errorMessage);
    });
  });

  describe("RemoteShellAction", () => {
    it("should have correct name and schema", () => {
      const action = new RemoteShellAction();
      expect(action.name).toBe("remote_shell");
      expect(action.schema.shape).toHaveProperty("command");
    });

    it("should execute command through action interface", async () => {
      // Update to mock method instead of property
      (sshManager.isConnected as jest.Mock).mockReturnValue(true);
      const mockOutput = "Command output";
      jest.spyOn(sshManager, "execute").mockResolvedValue(mockOutput);

      const action = new RemoteShellAction();
      const result = await action.func({ command: "ls -la" });

      expect(result).toBe(mockOutput);
      expect(sshManager.execute).toHaveBeenCalledWith("ls -la");
    });
  });
});
