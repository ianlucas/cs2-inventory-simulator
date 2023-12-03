/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  faCircleInfo,
  faCircleNotch,
  faUnlock,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS_Economy,
  CS_Item,
  CS_listCaseContents,
  CS_resolveItemImage,
  CS_unlockCase
} from "@ianlucas/cslib";
import clsx from "clsx";
import { ComponentProps, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useDetectCollision } from "~/hooks/use-detect-collision";
import { useResponsiveScale } from "~/hooks/use-responsive-scale";
import { useTranslation } from "~/hooks/use-translation";
import {
  ApiActionUnlockCaseActionData,
  ApiActionUnlockCaseUrl
} from "~/routes/api.action.unlock-case._index";
import { baseUrl } from "~/utils/economy";
import { postJson } from "~/utils/fetch";
import { range } from "~/utils/number";
import { playSound } from "~/utils/sound";
import { CaseOpeningWheel } from "./case-opening-wheel";
import { CaseSpecialItem } from "./case-special-item";
import { CSItem } from "./cs-item";
import { useRootContext } from "./root-context";

function Layer({
  absolute,
  block,
  className,
  ...props
}: ComponentProps<"div"> & {
  absolute?: boolean;
  block?: boolean;
}) {
  return (
    <div
      {...props}
      className={clsx(
        absolute ? "absolute" : "fixed",
        "left-0 top-0 h-full w-full",
        block ? undefined : "flex items-center justify-center",
        className
      )}
    />
  );
}

export function CaseOpening({
  caseIndex,
  caseItem,
  onClose,
  keyIndex
}: {
  caseIndex: number;
  caseItem: CS_Item;
  onClose(): void;
  keyIndex?: number;
}) {
  const { user, setInventory } = useRootContext();
  const translate = useTranslation();
  const [items, setItems] = useState<ReturnType<typeof CS_unlockCase>[]>([]);
  const [isDisplaying, setIsDisplaying] = useState(false);
  const [canRoll, setCanRoll] = useState(true);
  const [unlockedItem, setUnlockedItem] =
    useState<ReturnType<typeof CS_unlockCase>>();
  const [rolledScale, setRolledScale] = useState(0);
  const [contentsTranslateY, setContentsTranslateY] = useState(0);
  const scale = useResponsiveScale();
  const targetRef = useRef<HTMLDivElement>(null);
  const hitsRef = useRef<HTMLDivElement>(null);

  async function roll() {
    setIsDisplaying(false);
    setCanRoll(false);
    /** @TODO Error handling needed, page will just get stuck if this fails. */
    const unlockedItem = user === undefined ? CS_unlockCase(caseItem) : await postJson<ApiActionUnlockCaseActionData>(
      ApiActionUnlockCaseUrl,
      { caseIndex, keyIndex }
    );
    setTimeout(() => {
      setContentsTranslateY(500);
      playSound("/open.mp3");
      setTimeout(() => {
        const items = range(32).map((_, index) =>
          index === 28 ? unlockedItem : CS_unlockCase(caseItem)
        );
        setItems(items);
        setIsDisplaying(true);
        setTimeout(() => {
          setUnlockedItem(unlockedItem);
          setInventory((inventory) =>
            inventory.unlockCase(unlockedItem, caseIndex, keyIndex)
          );
          playSound(`/case_awarded_${unlockedItem.rarity}.mp3`);
          setTimeout(() => {
            setRolledScale(scale);
          }, 100);
        }, 6000);
      }, 100);
    }, 250);
  }

  useDetectCollision({
    disabled: !isDisplaying,
    target: targetRef,
    hits: hitsRef,
    then() {
      playSound("/roll.mp3");
    }
  });

  const receivedItem =
    unlockedItem !== undefined
      ? CS_Economy.getById(unlockedItem.id)
      : undefined;

  return (
    <ClientOnly>
      {() =>
        createPortal(
          <Layer
            className={clsx("z-50 select-none bg-black/60 backdrop-blur-sm")}
          >
            {unlockedItem && receivedItem ? (
              <>
                <Layer
                  className="[transition:all_cubic-bezier(0.4,0,0.2,1)_250ms]"
                  style={{ transform: `scale(${rolledScale})` }}
                >
                  <img
                    src={CS_resolveItemImage(
                      baseUrl,
                      receivedItem,
                      unlockedItem.attributes.wear
                    )}
                    draggable={false}
                  />
                </Layer>
                <div className="fixed left-0 top-28 h-full w-full text-center drop-shadow">
                  <div className="px-4 text-2xl font-bold">
                    <span
                      className="border-b-4 pb-1 drop-shadow"
                      style={{ borderColor: receivedItem.rarity }}
                    >
                      {unlockedItem.attributes.stattrak !== undefined &&
                        translate("InventoryItemStatTrak")}{" "}
                      {receivedItem.name}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2 text-lg">
                    <img
                      src={caseItem.image}
                      draggable={false}
                      className="h-8"
                    />
                    <span>{caseItem.name}</span>
                  </div>
                </div>
                <div className="fixed bottom-28 left-0 flex w-full items-center justify-center gap-8 text-center drop-shadow">
                  {unlockedItem.attributes.wear !== undefined && (
                    <div>
                      <div className="text-sm font-bold">
                        {translate("CaseWear")}
                      </div>
                      <div>{unlockedItem.attributes.wear}</div>
                    </div>
                  )}
                  {unlockedItem.attributes.wear !== undefined && (
                    <div>
                      <div className="text-sm font-bold">
                        {translate("CaseSeed")}
                      </div>
                      <div>{unlockedItem.attributes.seed}</div>
                    </div>
                  )}
                  <button
                    className="flex cursor-default items-center gap-2 rounded bg-white/80 px-4 py-2 font-bold text-neutral-700 drop-shadow-lg transition hover:bg-white disabled:bg-neutral-500 disabled:text-neutral-700"
                    onClick={onClose}
                  >
                    <FontAwesomeIcon icon={faXmark} className="h-4" />
                    {translate("CaseClose")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <Layer
                  className={clsx(
                    "scale-[1] transition-all md:scale-[2]",
                    !canRoll && "blur-sm",
                    canRoll && "blur-[1px]"
                  )}
                >
                  <img
                    className="h-[198px] w-[256px]"
                    src={CS_resolveItemImage(baseUrl, caseItem)}
                  />
                </Layer>
                <div className="fixed left-0 top-28 h-full w-full text-center drop-shadow">
                  <div className="text-2xl font-bold">
                    {translate("CaseUnlockContainer")}
                  </div>
                  <div className="text-lg">
                    {translate("CaseUnlock")} <strong>{caseItem.name}</strong>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faCircleInfo} className="h-4" />
                    <span>{translate("CaseOnceWarn")}</span>
                  </div>
                </div>
                <CaseOpeningWheel
                  caseItem={caseItem}
                  hitsRef={hitsRef}
                  isDisplaying={isDisplaying}
                  items={items}
                  scale={scale}
                  targetRef={targetRef}
                />
                <div
                  className="fixed bottom-0 left-0 flex w-full justify-center gap-4 pb-28 drop-shadow [transition:all_cubic-bezier(0.4,0,0.2,1)_500ms]"
                  style={{
                    transform: `translateY(${contentsTranslateY}px)`
                  }}
                >
                  <div className="m-auto max-w-[1024px] rounded bg-gradient-to-b from-transparent to-white/20 p-2">
                    <h2 className="my-2">{translate("CaseContainsOne")}</h2>
                    <div className="flex h-[320px] flex-wrap gap-3 overflow-y-scroll">
                      {[
                        ...CS_listCaseContents(caseItem, true).map(
                          (item, index) => <CSItem key={index} item={item} />
                        ),
                        caseItem.specialcontents !== undefined && (
                          <CaseSpecialItem key={-1} caseItem={caseItem} />
                        )
                      ]}
                    </div>
                  </div>
                </div>
                <div className="fixed bottom-12 left-0 flex w-full justify-center gap-4 drop-shadow">
                  <button
                    disabled={!canRoll}
                    className="flex cursor-default items-center gap-2 rounded bg-white/80 px-4 py-2 font-bold text-neutral-700 drop-shadow-lg transition hover:bg-white disabled:bg-neutral-500 disabled:text-neutral-700"
                    onClick={onClose}
                  >
                    <FontAwesomeIcon icon={faXmark} className="h-4" />
                    {translate("CaseClose")}
                  </button>
                  <button
                    onClick={roll}
                    disabled={!canRoll}
                    className="flex cursor-default items-center gap-2 rounded bg-green-700/80 px-4 py-2 font-bold text-neutral-200 drop-shadow-lg transition hover:bg-green-600 disabled:bg-green-900 disabled:text-green-600"
                  >
                    {canRoll ? (
                      <FontAwesomeIcon icon={faUnlock} className="h-4" />
                    ) : (
                      <FontAwesomeIcon
                        icon={faCircleNotch}
                        className="h-4 animate-spin"
                      />
                    )}
                    {translate("CaseUnlockContainer")}
                  </button>
                </div>
              </>
            )}
          </Layer>,
          document.body
        )
      }
    </ClientOnly>
  );
}
