/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useTranslate } from "./app-context";
import { IconWithTooltip } from "./icon-with-tooltip";

export function StickerControlHints() {
  const translate = useTranslate();
  return (
    <div className="mt-4 flex justify-center">
      <div className="inline-flex items-center gap-5 rounded-md bg-black/25 p-2 px-6">
        <IconWithTooltip
          src="/images/vectors/move_sticker.svg"
          tooltip={translate("ApplyStickerHintMoveSticker")}
        />
        <IconWithTooltip
          src="/images/vectors/rotate_sticker.svg"
          tooltip={translate("ApplyStickerHintRotateSticker")}
        />
        <IconWithTooltip
          src="/images/vectors/rotate_weapon.svg"
          tooltip={translate("ApplyStickerHintRotateWeapon")}
        />
        <div className="h-7.5 w-px bg-white/35" />
        <IconWithTooltip
          src="/images/vectors/mouse_zoom_camera.svg"
          tooltip={translate("ApplyStickerHintZoomCamera")}
        />
        <IconWithTooltip
          src="/images/vectors/shift_pan_camrea.svg"
          tooltip={translate("ApplyStickerHintPanCamera")}
        />
      </div>
    </div>
  );
}
