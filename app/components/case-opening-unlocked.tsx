/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Economy, CS_Item, CS_unlockCase } from "@ianlucas/cslib";
import { useEffect, useState } from "react";
import { useTranslation } from "~/hooks/use-translation";
import { playSound } from "~/utils/sound";
import { CaseOpeningAttribute } from "./case-opening-attribute";
import { CaseOpeningButton } from "./case-opening-button";
import { CaseOpeningFooter } from "./case-opening-footer";
import { CSItemImage } from "./cs-item-image";

export function CaseOpeningUnlocked({
  caseItem,
  onClose,
  unlockedItem: { attributes, id, rarity }
}: {
  caseItem: CS_Item;
  onClose(): void;
  unlockedItem: ReturnType<typeof CS_unlockCase>;
}) {
  const translate = useTranslation();
  const [revealScale, setRevealScale] = useState(0);

  useEffect(() => {
    const idx = setTimeout(() => {
      setRevealScale(1);
      playSound(`/case_awarded_${rarity}.mp3`);
    }, 200);
    return () => clearTimeout(idx);
  }, []);

  const item = CS_Economy.getById(id);

  return (
    <div className="flex h-full w-full items-center justify-center text-center drop-shadow">
      <div>
        <div className="px-4 text-2xl">
          <span
            className="border-b-4 pb-2 font-display font-semibold leading-10 tracking-wider drop-shadow"
            style={{ borderColor: item.rarity }}
          >
            {attributes.stattrak !== undefined &&
              translate("InventoryItemStatTrak")}{" "}
            {item.name}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <CSItemImage className="h-8" item={caseItem} />
          <span>{caseItem.name}</span>
        </div>
        <CSItemImage
          className="m-auto my-4 [transition:all_cubic-bezier(0.4,0,0.2,1)_250ms]"
          item={item}
          style={{ transform: `scale(${revealScale})` }}
          wear={attributes.wear}
        />
        <CaseOpeningFooter
          left={
            <div className="flex items-center gap-8">
              <CaseOpeningAttribute
                label={translate("CaseWear")}
                value={attributes.wear}
              />
              <CaseOpeningAttribute
                label={translate("CaseSeed")}
                value={attributes.seed}
              />
            </div>
          }
          right={
            <CaseOpeningButton
              children={translate("CaseClose")}
              onClick={onClose}
              variant="secondary"
            />
          }
        />
      </div>
    </div>
  );
}
