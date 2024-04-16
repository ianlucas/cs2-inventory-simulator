/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Economy, CS_Item } from "@ianlucas/cs2-lib";
import { getItemNameString } from "~/utils/inventory";
import { useAppContext } from "./app-context";
import { FillSpinner } from "./fill-spinner";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { UnlockCaseContainerBackground } from "./unlock-case-container-background";
import { UnlockCaseContainerContents } from "./unlock-case-container-contents";
import { UnlockCaseWheel } from "./unlock-case-wheel";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";

export function UnlockCaseContainer({
  canUnlock,
  caseItem,
  hideCaseContents,
  isDisplaying,
  items,
  keyItem,
  onClose,
  onUnlock
}: {
  canUnlock: boolean;
  caseItem: CS_Item;
  hideCaseContents: boolean;
  isDisplaying: boolean;
  items: ReturnType<typeof CS_Economy.unlockCase>[];
  keyItem?: CS_Item;
  onClose: () => void;
  onUnlock: () => void;
}) {
  const {
    translations: { translate }
  } = useAppContext();

  return (
    <>
      <UnlockCaseContainerBackground
        canUnlock={canUnlock}
        caseItem={caseItem}
      />
      <div className="flex flex-col gap-4">
        <UseItemHeader
          actionDesc={translate("CaseUnlock")}
          actionItem={getItemNameString(caseItem)}
          title={translate("CaseUnlockContainer")}
          warning={translate("CaseOnceWarn")}
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
            className="max-w-[1024px]"
            left={
              keyItem !== undefined && (
                <div className="flex items-center gap-2 font-display text-lg">
                  <ItemImage className="h-14" item={keyItem} />
                  <span>
                    {translate("CaseUse")}{" "}
                    <strong>{getItemNameString(keyItem)}</strong>
                  </span>
                </div>
              )
            }
            right={
              <>
                {canUnlock ? (
                  <ModalButton
                    children={translate("CaseUnlockContainer")}
                    disabled={!canUnlock}
                    onClick={onUnlock}
                    variant="primary"
                  />
                ) : (
                  <FillSpinner className="mx-4" />
                )}
                <ModalButton
                  children={translate("CaseClose")}
                  disabled={!canUnlock}
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
