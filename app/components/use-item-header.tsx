/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { InfoIcon } from "./info-icon";
import { StickerControlHints } from "./sticker-control-hints";

export function UseItemHeader({
  actionDesc,
  actionItem,
  stickerHint,
  title,
  warning,
  warningItem
}: {
  actionDesc?: string;
  actionItem?: string;
  stickerHint?: boolean;
  title: string;
  warning?: string;
  warningItem?: string;
}) {
  return (
    <>
      <div className="text-center text-white/80 drop-shadow-sm">
        <div className="font-display text-4xl/10 font-medium tracking-wider">
          {title}
        </div>
        {actionDesc !== undefined && (
          <div className="mt-2 text-lg">
            {actionDesc}{" "}
            {actionItem !== undefined && <strong>{actionItem}</strong>}
          </div>
        )}
        {warning !== undefined && (
          <div className="mt-2 flex items-center justify-center gap-2 text-sm">
            <InfoIcon className="h-6" />
            <span>{warning}</span>
            {warningItem !== undefined && <strong>{warningItem}</strong>}
          </div>
        )}
      </div>
      {stickerHint && <StickerControlHints />}
    </>
  );
}
