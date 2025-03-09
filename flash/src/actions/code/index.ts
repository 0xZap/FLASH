import { ZapAction, ZapActionSchema } from "../zap_action";
import { PYTHON_CODE_ACTIONS } from "./python";

/**
 * Retrieves all code execution action instances.
 * WARNING: All new code action classes must be instantiated here to be discovered.
 *
 * @returns - Array of code action instances
 */
export function getCodeActions(): ZapAction<ZapActionSchema>[] {
  return [
    ...PYTHON_CODE_ACTIONS,
    // Add other code execution actions here
  ];
}

export const CODE_ACTIONS = getCodeActions();

export * from "./python"; 