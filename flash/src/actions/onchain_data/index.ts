import { ALCHEMY_ACTIONS } from "./alchemy";
import { ZapAction } from "../zap_action";

export * from "./alchemy";

export const ONCHAIN_DATA_ACTIONS: ZapAction<any>[] = [...ALCHEMY_ACTIONS]; 