/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2EconomyItem, CS2UnlockedItem } from "@ianlucas/cs2-lib";
import { useState } from "react";
import { useNameItemString } from "~/components/hooks/use-name-item";
import { createFakeInventoryItem } from "~/utils/inventory";
import { playSound } from "~/utils/sound";
import { useLocalize } from "./app-context";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { UnlockCaseAttribute } from "./unlock-case-attribute";
import { UseItemFooter } from "./use-item-footer";

export function UnlockCaseContainerUnlocked({
  caseItem,
  onClose,
  unlockedItem: { attributes, id, rarity }
}: {
  caseItem: CS2EconomyItem;
  onClose: () => void;
  unlockedItem: CS2UnlockedItem;
}) {
  const localize = useLocalize();
  const nameItemString = useNameItemString();
  const [revealScale, setRevealScale] = useState(0);

  function handleLoad() {
    setRevealScale(1);
    playSound(
      `case_awarded_${rarity as "common" | "uncommon" | "rare" | "mythical" | "legendary" | "ancient"}`
    );
  }

  const item = CS2Economy.getById(id);

  return (
    <div className="flex h-full w-full items-center justify-center text-center drop-shadow-sm">
      <div>
        <div className="px-4 text-2xl">
          <span
            className="font-display border-b-4 pb-2 leading-10 font-medium tracking-wider drop-shadow-sm"
            style={{ borderColor: item.rarity }}
          >
            {nameItemString(createFakeInventoryItem(item, attributes))}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <ItemImage className="h-8" item={caseItem} />
          <span>{nameItemString(caseItem)}</span>
        </div>
        <ItemImage
          className="m-auto my-4 [transition:all_cubic-bezier(0.4,0,0.2,1)_250ms]"
          item={item}
          style={{ transform: `scale(${revealScale})` }}
          onLoad={handleLoad}
          wear={attributes.wear}
        />
        <UseItemFooter
          className="lg:min-w-[1024px]"
          left={
            <div className="flex items-center gap-8">
              <UnlockCaseAttribute
                label={localize("CaseWear")}
                value={attributes.wear}
              />
              <UnlockCaseAttribute
                label={localize("CaseSeed")}
                value={attributes.seed}
              />
            </div>
          }
          right={
            <ModalButton
              children={localize("CaseClose")}
              onClick={onClose}
              variant="secondary"
            />
          }
        />
      </div>
    </div>
  );
}
