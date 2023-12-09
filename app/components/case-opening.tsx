/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS_Economy,
  CS_Item,
  CS_listCaseContents,
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
import { resolveItemImage } from "~/utils/economy";
import { postJson } from "~/utils/fetch";
import { range } from "~/utils/number";
import { playSound } from "~/utils/sound";
import { CaseOpeningWheel } from "./case-opening-wheel";
import { CaseSpecialItem } from "./case-special-item";
import { CSItem } from "./cs-item";
import { InfoIcon } from "./info-icon";
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
  keyIndex,
  keyItem,
  onClose
}: {
  caseIndex: number;
  caseItem: CS_Item;
  keyIndex?: number;
  keyItem?: CS_Item;
  onClose(): void;
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
    const unlockedItem =
      user === undefined
        ? CS_unlockCase(caseItem)
        : await postJson<ApiActionUnlockCaseActionData>(
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
              <div className="flex h-full w-full items-center justify-center text-center drop-shadow">
                <div>
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
                  <img
                    className="m-auto my-4 [transition:all_cubic-bezier(0.4,0,0.2,1)_250ms]"
                    src={resolveItemImage(
                      receivedItem,
                      unlockedItem.attributes.wear
                    )}
                    draggable={false}
                    style={{ transform: `scale(${rolledScale})` }}
                  />
                  <div className="flex w-full items-center justify-between gap-8 border-t border-t-white/10 pt-1.5 text-center drop-shadow">
                    <div className="flex items-center gap-8">
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
                    </div>
                    <button
                      className="flex h-9 cursor-default items-center gap-2 rounded-sm px-2 font-semibold uppercase text-neutral-100 drop-shadow-lg transition hover:bg-neutral-500/30 hover:text-white disabled:bg-transparent disabled:text-neutral-700"
                      onClick={onClose}
                    >
                      <span className="scale-x-[0.8]">
                        {translate("CaseClose")}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
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
                    src={resolveItemImage(caseItem)}
                  />
                </Layer>
                <div className="fixed left-0 top-28 h-full w-full text-center drop-shadow">
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
                  hitsRef={hitsRef}
                  isDisplaying={isDisplaying}
                  items={items}
                  scale={scale}
                  targetRef={targetRef}
                />
                <div className="fixed bottom-12 left-0 w-full">
                  <div
                    className="m-auto max-w-[1024px] rounded bg-gradient-to-b from-transparent to-white/20 p-2 [transition:all_cubic-bezier(0.4,0,0.2,1)_500ms]"
                    style={{
                      transform: `translateY(${contentsTranslateY}px)`
                    }}
                  >
                    <h2 className="my-2 border-b border-b-white/50 pb-2">
                      {translate("CaseContainsOne")}
                    </h2>
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
                  <div className="m-auto flex min-h-[63px] max-w-[800px] items-center justify-between border-t border-t-white/10 pt-1.5 drop-shadow">
                    {keyItem !== undefined && (
                      <div className="font-display flex items-center gap-2 text-lg">
                        <img
                          className="h-14"
                          src={resolveItemImage(keyItem)}
                          alt={keyItem.name}
                        />
                        <span>
                          {translate("CaseUse")} <strong>{keyItem.name}</strong>
                        </span>
                      </div>
                    )}
                    <div className="font-display flex flex-1 items-center justify-end gap-2 text-lg font-semibold">
                      {canRoll ? (
                        <button
                          onClick={roll}
                          disabled={!canRoll}
                          className="flex h-9 cursor-default items-center gap-2 rounded-sm bg-green-700/80 uppercase text-neutral-200 drop-shadow-lg transition hover:bg-green-600 disabled:bg-green-900 disabled:text-green-600"
                        >
                          <span className="scale-x-[0.8]">
                            {translate("CaseUnlockContainer")}
                          </span>
                        </button>
                      ) : (
                        <FontAwesomeIcon
                          icon={faCircleNotch}
                          className="h-7 animate-spin px-4 text-white"
                        />
                      )}
                      <button
                        disabled={!canRoll}
                        className="flex h-9 cursor-default items-center gap-2 rounded-sm px-2 uppercase text-neutral-100 drop-shadow-lg transition hover:bg-neutral-500/30 hover:text-white disabled:bg-transparent disabled:text-neutral-700"
                        onClick={onClose}
                      >
                        <span className="scale-x-[0.8]">
                          {translate("CaseClose")}
                        </span>
                      </button>
                    </div>
                  </div>
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
