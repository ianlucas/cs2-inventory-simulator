/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item, CS_unlockCase } from "@ianlucas/cslib";
import { useTranslation } from "~/hooks/use-translation";
import { CaseOpeningButton } from "./case-opening-button";
import { CaseOpeningCaseBackground } from "./case-opening-case-background";
import { CaseOpeningCaseContents } from "./case-opening-case-contents";
import { CaseOpeningFooter } from "./case-opening-footer";
import { CaseOpeningWheel } from "./case-opening-wheel";
import { CSItemImage } from "./cs-item-image";
import { FillSpinner } from "./fill-spinner";
import { InfoIcon } from "./info-icon";

export function CaseOpeningCase({
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
  items: ReturnType<typeof CS_unlockCase>[];
  keyItem?: CS_Item;
  onClose(): void;
  onUnlock(): void;
}) {
  const translate = useTranslation();

  return (
    <>
      <CaseOpeningCaseBackground canUnlock={canUnlock} caseItem={caseItem} />
      <div className="flex flex-col gap-4">
        <div className="text-center drop-shadow">
          <div className="font-display text-3xl font-semibold leading-10 tracking-wider">
            {translate("CaseUnlockContainer")}
          </div>
          <div className="text-lg">
            {translate("CaseUnlock")} <strong>{caseItem.name}</strong>
          </div>
          <div className="mt-2 flex items-center justify-center gap-2">
            <InfoIcon />
            <span>{translate("CaseOnceWarn")}</span>
          </div>
        </div>
        <CaseOpeningWheel
          caseItem={caseItem}
          isDisplaying={isDisplaying}
          items={items}
        />
      </div>
      <div className="fixed bottom-12 left-0 w-full">
        <CaseOpeningCaseContents
          caseItem={caseItem}
          hideCaseContents={hideCaseContents}
        />
        <CaseOpeningFooter
          left={
            keyItem !== undefined && (
              <div className="flex items-center gap-2 font-display text-lg">
                <CSItemImage className="h-14" item={keyItem} />
                <span>
                  {translate("CaseUse")} <strong>{keyItem.name}</strong>
                </span>
              </div>
            )
          }
          right={
            <>
              {canUnlock ? (
                <CaseOpeningButton
                  children={translate("CaseUnlockContainer")}
                  disabled={!canUnlock}
                  onClick={onUnlock}
                  variant="primary"
                />
              ) : (
                <FillSpinner className="mx-4" />
              )}
              <CaseOpeningButton
                children={translate("CaseClose")}
                disabled={!canUnlock}
                onClick={onClose}
                variant="secondary"
              />
            </>
          }
        />
      </div>
    </>
  );
}
