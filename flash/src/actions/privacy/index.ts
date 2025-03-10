import { ZapAction, ZapActionSchema } from "../zap_action";

// export * as nillion from './nillion';

/**
 * Retrieves all Privacy action instances.
 * WARNING: All new Privacy action classes must be instantiated here to be discovered.
 *
 * @returns - Array of Privacy action instances
 */
export function getPrivacyActions(): ZapAction<ZapActionSchema>[] {
  return [
  ];
}

export const PRIVACY_ACTIONS = getPrivacyActions();

// Export individual actions here as they are created
export {
};
