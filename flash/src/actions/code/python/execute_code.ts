import { z } from "zod";
import { ZapAction } from "../../zap_action";
import { ExecutePythonSchema, EXECUTE_PYTHON_PROMPT, EXECUTE_PYTHON_ACTION_NAME } from "../../../actions_schemas/code/python/execute_code";

// Add type declaration for Pyodide
declare module 'pyodide' {
  export function loadPyodide(config?: {
    indexURL?: string;
    stdout?: (text: string) => void;
    stderr?: (text: string) => void;
    wasmMemory?: WebAssembly.Memory;
  }): Promise<any>;
}

/**
 * Executes Python code in a secure sandboxed environment using Pyodide.
 * @param params Execution parameters
 * @returns Result of the Python code execution
 */
export async function executePythonCode(params: z.infer<typeof ExecutePythonSchema>): Promise<string> {
  try {
    // Dynamically import Pyodide to avoid issues with server-side rendering
    const { loadPyodide } = await import('pyodide');
    
    // Initialize Pyodide with memory limit if specified
    // Note: Memory limit requires Pyodide 0.18.0+
    const pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
      stdout: (text) => { outputBuffer += text + "\\n"; },
      stderr: (text) => { errorBuffer += text + "\\n"; },
      ...(params.memory_limit ? { 
        wasmMemory: new WebAssembly.Memory({ 
          initial: Math.ceil(params.memory_limit / 64), 
          maximum: Math.ceil(params.memory_limit / 64) 
        })
      } : {})
    });

    // Buffers to capture standard output and errors
    let outputBuffer = '';
    let errorBuffer = '';

    // Install requested packages if any
    if (params.packages && params.packages.length > 0) {
      await pyodide.loadPackagesFromImports(params.packages.join("\\n"));
    }

    // Setup matplotlib if plotting is requested
    let plotData = null;
    if (params.show_plots) {
      await pyodide.loadPackagesFromImports('matplotlib');
      await pyodide.runPythonAsync(`
        import matplotlib
        matplotlib.use('module://matplotlib.backends.base_backend')
        import io, base64
        import matplotlib.pyplot as plt
        
        def get_plot_data():
            buf = io.BytesIO()
            plt.savefig(buf, format='png')
            buf.seek(0)
            img_str = 'data:image/png;base64,' + base64.b64encode(buf.read()).decode('UTF-8')
            plt.close()
            return img_str
      `);
    }

    // Prepare a promise to run the Python code
    const executionPromise = pyodide.runPythonAsync(params.code);
    let result: string;
    
    try {
      // Run the code with a timeout
      const output = await Promise.race([
        executionPromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Execution timed out after ${params.timeout} seconds`)), 
          params.timeout * 1000)
        ),
      ]);

      // Check if there's a plot to capture
      if (params.show_plots) {
        try {
          plotData = await pyodide.runPythonAsync('get_plot_data()');
        } catch (plotError) {
          // Just ignore plot errors
        }
      }
      
      // Prepare successful result
      result = formatExecutionResult({
        output: output !== undefined ? String(output) : "",
        stdout: outputBuffer,
        stderr: errorBuffer,
        plot: plotData
      });
    } catch (err: any) {
      // Prepare error result
      result = formatExecutionResult({
        error: err.message || "Execution failed",
        stdout: outputBuffer,
        stderr: errorBuffer
      });
    }
    
    return result;
  } catch (error: any) {
    return `Failed to initialize Pyodide: ${error.message || "Unknown error"}`;
  }
}

/**
 * Format the execution result in a consistent way.
 */
function formatExecutionResult({ 
  output = "", 
  stdout = "", 
  stderr = "", 
  error = "", 
  plot = null 
}: {
  output?: string;
  stdout?: string;
  stderr?: string;
  error?: string;
  plot?: string | null;
}): string {
  let result = "";
  
  if (stdout) {
    result += `## Standard Output\n\`\`\`\n${stdout.trim()}\n\`\`\`\n\n`;
  }
  
  if (stderr) {
    result += `## Standard Error\n\`\`\`\n${stderr.trim()}\n\`\`\`\n\n`;
  }
  
  if (error) {
    result += `## Error\n\`\`\`\n${error}\n\`\`\`\n\n`;
  } else if (output) {
    result += `## Result\n\`\`\`\n${output}\n\`\`\`\n\n`;
  }
  
  if (plot) {
    result += `## Plot\n![Python Plot](${plot})\n\n`;
  }
  
  return result.trim() || "Execution completed with no output.";
}

/**
 * Action to execute Python code in a sandboxed environment.
 */
export class ExecutePythonAction implements ZapAction<typeof ExecutePythonSchema> {
  public name = EXECUTE_PYTHON_ACTION_NAME; 
  public description = EXECUTE_PYTHON_PROMPT;
  public schema = ExecutePythonSchema;

  public func = (args: { [key: string]: any }): Promise<string> => {
    return executePythonCode({
      code: args.code,
      timeout: args.timeout || 5,
      memory_limit: args.memory_limit || 512,
      packages: args.packages || [],
      show_plots: args.show_plots !== undefined ? args.show_plots : false,
    });
  };
} 