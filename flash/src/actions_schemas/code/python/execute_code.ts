import { z } from "zod";

export const EXECUTE_PYTHON_ACTION_NAME = "execute_python";

export const ExecutePythonSchema = z
  .object({
    code: z
      .string()
      .min(1)
      .describe("The Python code to execute in the sandboxed environment."),
    timeout: z
      .number()
      .positive()
      .optional()
      .default(5)
      .describe("Maximum execution time in seconds (default: 5)."),
    memory_limit: z
      .number()
      .positive()
      .optional()
      .default(512)
      .describe("Maximum memory usage in MB (default: 512MB)."),
    packages: z
      .array(z.string())
      .optional()
      .default([])
      .describe("Optional list of Python packages to install before execution."),
    show_plots: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether to capture and return matplotlib plots (default: false)."),
  })
  .strict();

export const EXECUTE_PYTHON_PROMPT = `
This tool executes Python code in a secure, sandboxed WebAssembly environment using Pyodide.

Required inputs:
- code: The Python code to execute (as a string)

Optional inputs:
- timeout: Maximum execution time in seconds (default: 5)
- memory_limit: Maximum memory usage in MB (default: 512)
- packages: List of Python packages to install before execution (e.g. ["numpy", "pandas"])
- show_plots: Whether to capture and return matplotlib plots (default: false)

Important notes:
- The code runs in a sandbox with no access to the file system or network by default
- Long-running operations will be terminated after the timeout period
- Results include stdout, stderr, and return value from the last expression
- For plotting, use matplotlib and set show_plots to true

Example usage:
\`\`\`
{
  "code": "import math\\nresult = [math.factorial(n) for n in range(10)]\\nresult",
  "timeout": 3
}
\`\`\`

Example with matplotlib:
\`\`\`
{
  "code": "import matplotlib.pyplot as plt\\nimport numpy as np\\nx = np.linspace(0, 2*np.pi, 100)\\nplt.plot(x, np.sin(x))\\nplt.title('Sine Wave')\\nplt.show()",
  "timeout": 10,
  "packages": ["matplotlib", "numpy"],
  "show_plots": true
}
\`\`\`
`;