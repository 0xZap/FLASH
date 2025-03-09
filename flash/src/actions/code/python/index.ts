import { ZapAction, ZapActionSchema } from "../../zap_action";
import { ExecutePythonAction } from "./execute_code";

/**
 * Retrieves all Python code execution action instances.
 * WARNING: All new Python code action classes must be instantiated here to be discovered.
 *
 * @returns - Array of Python code action instances
 */
export function getPythonCodeActions(): ZapAction<ZapActionSchema>[] {
  return [
    new ExecutePythonAction() as unknown as ZapAction<ZapActionSchema>,
  ];
}

export const PYTHON_CODE_ACTIONS = getPythonCodeActions();

export {
  ExecutePythonAction,
}; 