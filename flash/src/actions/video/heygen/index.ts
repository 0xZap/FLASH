import { ZapAction, ZapActionSchema } from "../../zap_action";
import { HeyGenConfig } from "../../../config/heygen_config";
import { ListAvatarsAction } from "./list_avatars";
import { ListVoicesAction } from "./list_voices";
import { GenerateAvatarVideoAction } from "./generate_avatar_video";
import { UploadTalkingPhotoAction } from "./upload_talking_photo";
import { GenerateTalkingPhotoVideoAction } from "./generate_talking_photo_video";
import { CheckVideoStatusAction } from "./check_video_status";

/**
 * Retrieves all HeyGen action instances.
 * WARNING: All new HeyGen action classes must be instantiated here to be discovered.
 *
 * @returns - Array of HeyGen action instances
 */
export function getHeyGenActions(config?: HeyGenConfig): ZapAction<ZapActionSchema>[] {
  // If config is provided, ensure it's set as the instance
  if (config) {
    HeyGenConfig.resetInstance();
    HeyGenConfig.getInstance({ 
      apiKey: config.getApiKey() || undefined,
    });
  }

  return [
    new ListAvatarsAction() as unknown as ZapAction<ZapActionSchema>,
    new ListVoicesAction() as unknown as ZapAction<ZapActionSchema>,
    new GenerateAvatarVideoAction() as unknown as ZapAction<ZapActionSchema>,
    new UploadTalkingPhotoAction() as unknown as ZapAction<ZapActionSchema>,
    new GenerateTalkingPhotoVideoAction() as unknown as ZapAction<ZapActionSchema>,
    new CheckVideoStatusAction() as unknown as ZapAction<ZapActionSchema>,
  ];
}

export const HEYGEN_ACTIONS = getHeyGenActions();

export {
  HeyGenConfig,
  ListAvatarsAction,
  ListVoicesAction,
  GenerateAvatarVideoAction,
  UploadTalkingPhotoAction,
  GenerateTalkingPhotoVideoAction,
  CheckVideoStatusAction,
}; 