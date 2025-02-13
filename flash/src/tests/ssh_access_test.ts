import { connectSSH, SSHAccessAction } from "../actions/hyperbolic/ssh_access";
import { SSHManager } from "../actions/hyperbolic/helpers/ssh_manager";

// Mock the SSHManager
jest.mock("../actions/hyperbolic/helpers/ssh_manager");

class SSHAccessTest {
  OLD_ENV: NodeJS.ProcessEnv;

  constructor() {
    this.OLD_ENV = process.env;
  }

  beforeEach() {
    jest.resetModules();
    process.env = { ...this.OLD_ENV };
    // Mock getInstance to return our mocked instance
    SSHManager.getInstance = jest.fn().mockReturnValue({
      connect: jest.fn().mockResolvedValue("Successfully connected to remote server"),
    });
  }

  afterEach() {
    process.env = this.OLD_ENV;
    jest.clearAllMocks();
  }

  async testConnectWithPasswordAuthentication() {
    const params = {
      host: "test-server.com",
      username: "testuser",
      password: "testpass",
      port: 22,
    };

    const result = await connectSSH(params);

    const sshManager = SSHManager.getInstance();
    expect(sshManager.connect).toHaveBeenCalledWith(
      "test-server.com",
      "testuser",
      "testpass",
      undefined,
      22,
    );
    expect(result).toBe("Successfully connected to remote server");
  }

  // ... other test methods
}

describe("SSH Access", () => {
  const testInstance = new SSHAccessTest();

  beforeEach(() => testInstance.beforeEach());
  afterEach(() => testInstance.afterEach());

  it("should successfully connect with password authentication", async () => {
    await testInstance.testConnectWithPasswordAuthentication();
  });

  it("should successfully connect with private key authentication", async () => {
    const params = {
      host: "test-server.com",
      username: "testuser",
      private_key_path: "/path/to/key",
      port: 22,
    };

    const result = await connectSSH(params);

    const sshManager = SSHManager.getInstance();
    expect(sshManager.connect).toHaveBeenCalledWith(
      "test-server.com",
      "testuser",
      undefined,
      "/path/to/key",
      22,
    );
    expect(result).toBe("Successfully connected to remote server");
  });

  it("should use SSH_PRIVATE_KEY_PATH from environment when private key not provided", async () => {
    process.env.SSH_PRIVATE_KEY_PATH = "/env/path/to/key";

    const params = {
      host: "test-server.com",
      username: "testuser",
      port: 22,
    };

    await connectSSH(params);

    const sshManager = SSHManager.getInstance();
    expect(sshManager.connect).toHaveBeenCalledWith(
      "test-server.com",
      "testuser",
      undefined,
      "/env/path/to/key",
      22,
    );
  });

  it("should handle connection errors appropriately", async () => {
    SSHManager.getInstance = jest.fn().mockReturnValue({
      connect: jest.fn().mockRejectedValue(new Error("Connection refused")),
    });

    const params = {
      host: "test-server.com",
      username: "testuser",
      password: "testpass",
      port: 22,
    };

    await expect(connectSSH(params)).rejects.toThrow("SSH connection failed: Connection refused");
  });

  it("should validate input parameters using schema", () => {
    const action = new SSHAccessAction();

    // Test required fields
    expect(() => action.schema.parse({})).toThrow();

    // Test valid input
    const validInput = {
      host: "test-server.com",
      username: "testuser",
      password: "testpass",
      port: 22,
    };
    expect(() => action.schema.parse(validInput)).not.toThrow();

    // Test invalid port
    const invalidPort = {
      ...validInput,
      port: "invalid",
    };
    expect(() => action.schema.parse(invalidPort)).toThrow();
  });
});
