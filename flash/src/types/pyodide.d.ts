declare module 'pyodide' {
  export interface PyodideInterface {
    runPythonAsync(code: string): Promise<any>;
    loadPackagesFromImports(imports: string): Promise<void>;
    runPython(code: string): any;
  }

  export interface PyodideConfig {
    indexURL?: string;
    stdout?: (text: string) => void;
    stderr?: (text: string) => void;
    wasmMemory?: WebAssembly.Memory;
  }

  export function loadPyodide(config?: PyodideConfig): Promise<PyodideInterface>;
} 