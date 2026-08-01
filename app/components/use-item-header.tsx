/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { InfoIcon } from "./info-icon";
import { KeychainControlHints } from "./keychain-control-hints";
import { StickerControlHints } from "./sticker-control-hints";

export function UseItemHeader({
  actionDesc,
  actionItem,
  keychainHint,
  stickerHint,
  title,
  warning,
  warningItem
}: {
  actionDesc?: string;
  actionItem?: string;
  keychainHint?: boolean;
  stickerHint?: boolean;
  title: string;
  warning?: string;
  warningItem?: string;
}) {
  return (
    <>
      <div className="text-center text-white/80 drop-shadow-sm">
        <div className="font-display text-4xl/10 font-medium">{title}</div>
        {actionDesc !== undefined && (
          <div className="mt-2 text-lg">
            {actionDesc}{" "}
            {actionItem !== undefined && <strong>{actionItem}</strong>}
          </div>
        )}
        {warning !== undefined && (
          <div
            className={clsx(
              "mx-auto flex max-w-160 items-center justify-center gap-2 text-sm",
              actionDesc !== undefined ? "mt-2" : "mt-8"
            )}
          >
            <InfoIcon className="h-6" />
            <span className="text-left whitespace-pre-line">{warning}</span>
            {warningItem !== undefined && <strong>{warningItem}</strong>}
          </div>
        )}
      </div>
      {stickerHint && <StickerControlHints />}
      {keychainHint && <KeychainControlHints />}
    </>
  );
}
