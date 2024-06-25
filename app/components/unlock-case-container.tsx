/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem, CS2UnlockedItem } from "@ianlucas/cs2-lib";
import { useNameItemString } from "~/components/hooks/use-name-item";
import { useLocalize } from "./app-context";
import { FillSpinner } from "./fill-spinner";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { UnlockCaseContainerAddKey } from "./unlock-case-container-add-key";
import { UnlockCaseContainerBackground } from "./unlock-case-container-background";
import { UnlockCaseContainerContents } from "./unlock-case-container-contents";
import { UnlockCaseWheel } from "./unlock-case-wheel";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";

export function UnlockCaseContainer({
  canUnlock,
  caseItem,
  caseUid,
  hideCaseContents,
  isDisplaying,
  isSyncing,
  items,
  keyItem,
  neededKeyItem,
  onClose,
  onUnlock
}: {
  canUnlock: boolean;
  caseItem: CS2EconomyItem;
  caseUid: number;
  hideCaseContents: boolean;
  isDisplaying: boolean;
  isSyncing: boolean;
  items: CS2UnlockedItem[];
  keyItem?: CS2EconomyItem;
  neededKeyItem?: CS2EconomyItem;
  onClose: () => void;
  onUnlock: () => void;
}) {
  const localize = useLocalize();
  const nameItemString = useNameItemString();
  const needsToAddKey = keyItem === undefined && neededKeyItem !== undefined;

  return (
    <>
      <UnlockCaseContainerBackground
        canUnlock={canUnlock}
        caseItem={caseItem}
      />
      <div className="flex w-full flex-col justify-center gap-4">
        <UseItemHeader
          actionDesc={localize("CaseUnlock")}
          actionItem={nameItemString(caseItem)}
          title={localize("CaseUnlockContainer")}
          warning={localize("CaseOnceWarn")}
        />
        <UnlockCaseWheel
          caseItem={caseItem}
          isDisplaying={isDisplaying}
          items={items}
        />
        <div className="relative">
          <UnlockCaseContainerContents
            caseItem={caseItem}
            hideCaseContents={hideCaseContents}
          />
          <UseItemFooter
            className="lg:max-w-[1024px]"
            left={
              keyItem !== undefined ? (
                <div className="flex items-center gap-2 font-display text-lg">
                  <ItemImage className="h-14" item={keyItem} />
                  <span>
                    {localize("CaseUse")}{" "}
                    <strong>{nameItemString(keyItem)}</strong>
                  </span>
                </div>
              ) : (
                neededKeyItem !== undefined && (
                  <div className="flex items-center gap-2 font-display text-lg">
                    <ItemImage className="h-14" item={neededKeyItem} />
                    <span>
                      {localize("CaseNeed")}{" "}
                      <strong>{nameItemString(neededKeyItem)}</strong>
                    </span>
                  </div>
                )
              )
            }
            right={
              <>
                {needsToAddKey ? (
                  <UnlockCaseContainerAddKey
                    caseUid={caseUid}
                    neededKeyItem={neededKeyItem}
                  />
                ) : canUnlock && !isSyncing ? (
                  <ModalButton
                    children={localize("CaseUnlockContainer")}
                    disabled={!canUnlock}
                    onClick={onUnlock}
                    variant="primary"
                  />
                ) : (
                  <FillSpinner className="mx-4" />
                )}
                <ModalButton
                  children={localize("CaseClose")}
                  disabled={isSyncing}
                  onClick={onClose}
                  variant="secondary"
                />
              </>
            }
          />
        </div>
      </div>
    </>
  );
}
