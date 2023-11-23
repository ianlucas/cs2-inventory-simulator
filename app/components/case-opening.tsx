/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faCircleInfo, faCircleNotch, faUnlock, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS_Item, CS_listCaseItems, CS_randomInt, CS_resolveCaseRareImage, CS_resolveItemImage, CS_roll } from "@ianlucas/cslib";
import { useWindowSize } from "@uidotdev/usehooks";
import clsx from "clsx";
import { ComponentProps, ForwardedRef, forwardRef, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useDetectCollision } from "~/hooks/use-detect-collision";
import { useTranslation } from "~/hooks/use-translation";
import { ApiActionUnlockCaseUrl } from "~/routes/api.action.unlock-case._index";
import { baseUrl } from "~/utils/economy";
import { postJson } from "~/utils/fetch";
import { range } from "~/utils/number";
import { playSound } from "~/utils/sound";
import { CaseRareItem } from "./case-rare-item";
import { CSItem } from "./cs-item";
import { useRootContext } from "./root-context";

function Layer(
  {
    absolute,
    block,
    className,
    ...props
  }: ComponentProps<"div"> & {
    absolute?: boolean;
    block?: boolean;
  }
) {
  return (
    <div
      {...props}
      className={clsx(
        absolute ? "absolute" : "fixed",
        "top-0 left-0 w-full h-full",
        block ? undefined : "flex items-center justify-center",
        className
      )}
    />
  );
}

function Item(
  {
    caseItem,
    item,
    index
  }: {
    caseItem: CS_Item;
    item: ReturnType<typeof CS_roll>;
    index: number;
  }
) {
  return (
    <div
      data-id={index}
      className="w-[256px] h-[192px] relative inline-block ml-4 first-of-type:ml-0"
      style={{
        backgroundImage:
          `linear-gradient(180deg, #8a8a8a 0%, #8a8a8a 60%, ${item.csItem.rarity} 92%, #000 100%)`
      }}
    >
      <div
        className="absolute left-0 bottom-0 h-2 w-full"
        style={{ backgroundColor: item.csItem.rarity }}
      />
      <img
        title={index.toString()}
        className="w-full h-full absolute top-0 left-0"
        src={item.special
          ? CS_resolveCaseRareImage(baseUrl, caseItem)
          : CS_resolveItemImage(baseUrl, item.csItem)}
      />
    </div>
  );
}

const Items = forwardRef(function Items(
  {
    caseItem,
    instant,
    items,
    translateX
  }: {
    caseItem: CS_Item;
    instant?: boolean;
    items: ReturnType<typeof CS_roll>[];
    translateX: number;
  },
  ref: ForwardedRef<Element>
) {
  return (
    <div
      className={clsx(
        "h-[192px] whitespace-nowrap",
        !instant && "[transition:all_6s_cubic-bezier(0,0.11,0.33,1)_0s]"
      )}
      ref={ref as any}
      style={{ transform: `translate(${translateX}px, 0)` }}
    >
      {items.map((item, index) => (
        <Item
          key={index}
          item={item}
          caseItem={caseItem}
          index={index}
        />
      ))}
    </div>
  );
});

function getRatio(width: number) {
  if (width >= 1920) {
    return 1;
  }
  if (width <= 360) {
    return 0.7;
  }
  const slope = (1 - 0.7) / (1920 - 360);
  const intercept = 1 - slope * 1920;
  return slope * width + intercept;
}

export function CaseOpening(
  {
    caseIndex,
    caseItem,
    onClose,
    keyIndex
  }: {
    caseIndex: number;
    caseItem: CS_Item;
    onClose(): void;
    keyIndex?: number;
  }
) {
  const { setInventory } = useRootContext();
  const translate = useTranslation();

  const [items, setItems] = useState<ReturnType<typeof CS_roll>[]>([]);
  const [translateX, setTranslateX] = useState(0);
  const [scaleY, setScaleY] = useState(0);
  const [canRoll, setCanRoll] = useState(true);
  const [scale, setScale] = useState(1);
  const [rolledItem, setRolledItem] = useState<ReturnType<typeof CS_roll>>();
  const [rolledScale, setRolledScale] = useState(0);
  const [contentsTranslateY, setContentsTranslateY] = useState(0);
  const targetRef = useRef<HTMLDivElement>(null);
  const hitsRef = useRef<HTMLDivElement>(null);
  const isDisplaying = scaleY !== 0;
  const size = useWindowSize();

  async function roll() {
    setScaleY(0);
    setCanRoll(false);
    /** @TODO Error handling needed, page will just get stuck if this fails. */
    /** @TODO We need to infer this from unlock case action. */
    const rolledItem = await postJson<ReturnType<typeof CS_roll>>(
      ApiActionUnlockCaseUrl,
      { caseIndex, keyIndex }
    );
    setTimeout(() => {
      setTranslateX(0);
      setContentsTranslateY(500);
      playSound("/open.mp3");
      setTimeout(() => {
        const items = range(32).map((_, index) =>
          index === 28 ? rolledItem : CS_roll(caseItem)
        );
        setItems(items);
        setScaleY(1);
        const randomOffset = CS_randomInt(188, 440);
        setTranslateX((-29 * 256) + randomOffset);
        setTimeout(() => {
          setRolledItem(rolledItem);
          setInventory(inventory =>
            inventory.unlockCase(caseIndex, keyIndex, rolledItem).state
          );
          playSound(`/case_awarded_${rolledItem.rarity}.mp3`);
          setTimeout(() => {
            setRolledScale(scale);
          }, 100);
        }, 6000);
      }, 100);
    }, 250);
  }

  useDetectCollision({
    disabled: canRoll || translateX === 0,
    target: targetRef,
    hits: hitsRef,
    then() {
      playSound("/roll.mp3");
    }
  });

  useEffect(() => {
    if (size.width) {
      setScale(getRatio(size.width));
    }
  }, [size]);

  return (
    <ClientOnly>
      {() =>
        createPortal(
          <Layer
            className={clsx(
              "z-50 backdrop-blur-sm bg-black/60 select-none"
            )}
          >
            {rolledItem
              ? (
                <>
                  <div className="fixed top-28 left-0 w-full h-full text-center drop-shadow">
                    <div className="font-bold text-2xl px-4">
                      <span
                        className="border-b-4 drop-shadow pb-1"
                        style={{ borderColor: rolledItem.csItem.rarity }}
                      >
                        {rolledItem.attributes.stattrak !== undefined
                          && translate("InventoryItemStatTrak")}{" "}
                        {rolledItem.csItem.name}
                      </span>
                    </div>
                    <div className="text-lg flex items-center justify-center gap-2 mt-4">
                      <img
                        src={caseItem.image}
                        draggable={false}
                        className="h-8"
                      />
                      <span>{caseItem.name}</span>
                    </div>
                  </div>
                  <Layer
                    className="[transition:all_cubic-bezier(0.4,0,0.2,1)_250ms]"
                    style={{ transform: `scale(${rolledScale})` }}
                  >
                    <img
                      src={CS_resolveItemImage(
                        baseUrl,
                        rolledItem.csItem,
                        rolledItem.attributes.wear
                      )}
                      draggable={false}
                    />
                  </Layer>
                  <div className="fixed bottom-28 left-0 w-full text-center drop-shadow flex items-center justify-center gap-8">
                    {rolledItem.attributes.wear !== undefined && (
                      <div>
                        <div className="font-bold text-sm">
                          {translate("CaseWear")}
                        </div>
                        <div>{rolledItem.attributes.wear}</div>
                      </div>
                    )}
                    {rolledItem.attributes.wear !== undefined && (
                      <div>
                        <div className="font-bold text-sm">
                          {translate("CaseSeed")}
                        </div>
                        <div>{rolledItem.attributes.seed}</div>
                      </div>
                    )}
                    <button
                      className="flex items-center gap-2 bg-white/80 hover:bg-white text-neutral-700 px-4 py-2 rounded font-bold drop-shadow-lg transition disabled:bg-neutral-500 disabled:text-neutral-700 cursor-default"
                      onClick={onClose}
                    >
                      <FontAwesomeIcon
                        icon={faXmark}
                        className="h-4"
                      />
                      {translate("CaseClose")}
                    </button>
                  </div>
                </>
              )
              : (
                <>
                  <Layer
                    className={clsx(
                      "scale-[1] md:scale-[2] transition-all",
                      !canRoll && "blur-sm",
                      canRoll && "blur-[1px]"
                    )}
                  >
                    <img
                      className="w-[256px] h-[198px]"
                      src={CS_resolveItemImage(baseUrl, caseItem)}
                    />
                  </Layer>
                  <div className="fixed top-28 left-0 w-full h-full text-center drop-shadow">
                    <div className="font-bold text-2xl">
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
                  <Layer block style={{ transform: `scale(${scale})` }}>
                    <Layer
                      block
                      className="[transition:all_cubic-bezier(0.4,0,0.2,1)_250ms]"
                      style={{ transform: `scaleY(${scaleY})` }}
                    >
                      <Layer className="blur-[2px] opacity-90 [-webkit-mask-image:radial-gradient(circle_closest-side,#fff0_246px,#000_246px)]">
                        <div className="h-[192px] overflow-hidden w-[1269.980px] [-webkit-mask-image:linear-gradient(to_left,#fff0_0%,#000_10%,#000_90%,#fff0_100%)]">
                          <Items
                            items={items}
                            caseItem={caseItem}
                            translateX={translateX}
                            instant={!isDisplaying}
                          />
                        </div>
                      </Layer>
                      <Layer className="scale-[1.15] opacity-95">
                        <div className="w-[1269.980px] h-[432px] bg-black/50 flex items-center relative [clip-path:circle(22.7%_at_50%_50%)]">
                          <Items
                            ref={hitsRef}
                            items={items}
                            caseItem={caseItem}
                            translateX={translateX}
                            instant={!isDisplaying}
                          />
                          <Layer absolute>
                            <div
                              ref={targetRef}
                              className="w-1 shadow shadow-black bg-[#aeb035] h-[192px]"
                            />
                          </Layer>
                        </div>
                      </Layer>
                    </Layer>
                  </Layer>
                  <div
                    className="fixed bottom-0 pb-28 left-0 w-full flex justify-center drop-shadow gap-4 [transition:all_cubic-bezier(0.4,0,0.2,1)_500ms]"
                    style={{
                      transform: `translateY(${contentsTranslateY}px)`
                    }}
                  >
                    <div className="max-w-[1024px] m-auto p-2 rounded bg-gradient-to-b from-transparent to-white/20">
                      <h2 className="my-2">{translate("CaseContainsOne")}</h2>
                      <div className="h-[320px] overflow-y-scroll flex flex-wrap gap-3">
                        {[
                          ...CS_listCaseItems(caseItem, true)
                            .map((csItem, index) => (
                              <CSItem key={index} csItem={csItem} />
                            )),
                          caseItem.rarecontents !== undefined && (
                            <CaseRareItem key={-1} caseItem={caseItem} />
                          )
                        ]}
                      </div>
                    </div>
                  </div>
                  <div className="fixed bottom-12 left-0 w-full flex justify-center drop-shadow gap-4">
                    <button
                      disabled={!canRoll}
                      className="flex items-center gap-2 bg-white/80 hover:bg-white text-neutral-700 px-4 py-2 rounded font-bold drop-shadow-lg transition disabled:bg-neutral-500 disabled:text-neutral-700 cursor-default"
                      onClick={onClose}
                    >
                      <FontAwesomeIcon
                        icon={faXmark}
                        className="h-4"
                      />
                      {translate("CaseClose")}
                    </button>
                    <button
                      onClick={roll}
                      disabled={!canRoll}
                      className="flex items-center gap-2 bg-green-700/80 hover:bg-green-600 text-neutral-200 px-4 py-2 rounded font-bold drop-shadow-lg transition disabled:bg-green-900 disabled:text-green-600 cursor-default"
                    >
                      {canRoll
                        ? (
                          <FontAwesomeIcon
                            icon={faUnlock}
                            className="h-4"
                          />
                        )
                        : (
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
        )}
    </ClientOnly>
  );
}
