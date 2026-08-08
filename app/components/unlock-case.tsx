/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2UnlockedItem, getNextUid } from "@ianlucas/cs2-lib";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import {
  useInventoryItem,
  useTryInventoryItem
} from "~/components/hooks/use-inventory-item";
import { useNameItemString } from "~/components/hooks/use-name-item";
import { useTimer } from "~/components/hooks/use-timer";
import {
  ApiActionUnlockCaseActionData,
  ApiActionUnlockCaseUrl
} from "~/routes/api.action.unlock-case._index";
import { dispatchSyncError, sync } from "~/sync";
import { unlockNonSpecialItem } from "~/utils/economy";
import { postJson } from "~/utils/fetch";
import { range } from "~/utils/number";
import { playSound } from "~/utils/sound";
import { useInventory, useTranslate, useUser } from "./app-context";
import { ConVar } from "./console";
import { useKeyRelease } from "./hooks/use-key-release";
import { useIsSyncing } from "./hooks/use-sync-state";
import { InGameOverlay } from "./in-game-overlay";
import { Presence } from "./presence";
import { UnlockCaseContainer } from "./unlock-case-container";
import { UseItemHeader } from "./use-item-header";

const fakeOdds = new ConVar("fake_odds", "0");

async function unlockCase(caseUid: number, keyUid?: number) {
  const { unlockedItem, syncedAt } =
    await postJson<ApiActionUnlockCaseActionData>(ApiActionUnlockCaseUrl, {
      syncedAt: sync.syncedAt,
      caseUid,
      keyUid
    });
  sync.syncedAt = syncedAt;
  return unlockedItem;
}

export function UnlockCase({
  caseUid,
  keyUid,
  onClose,
  onInspect
}: {
  caseUid: number;
  keyUid?: number;
  onClose: () => void;
  onInspect: (uid: number) => void;
}) {
  const user = useUser();
  const translate = useTranslate();
  const nameItemString = useNameItemString();
  const isSyncing = useIsSyncing();
  const [inventory, setInventory] = useInventory();
  const [items, setItems] = useState<CS2UnlockedItem[]>([]);
  const [isDisplaying, setIsDisplaying] = useState(false);
  const [canUnlock, setCanUnlock] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [hideCaseContents, setHideCaseContents] = useState(false);
  const isClosingRef = useRef(false);
  const unlockedItemRef = useRef<{
    actual: CS2UnlockedItem;
    displayed: CS2UnlockedItem;
  }>(undefined);

  const caseItem = useInventoryItem(caseUid);
  const neededKeyItem =
    caseItem.keyIds !== undefined
      ? CS2Economy.getById(caseItem.keyIds[0])
      : undefined;
  const keyItem = useTryInventoryItem(keyUid);
  const wait = useTimer();

  function addUnlockedItemToInventory() {
    const unlockedItem = unlockedItemRef.current;
    if (unlockedItem === undefined) {
      return undefined;
    }
    const unlockedUid = getNextUid(
      new Map(
        inventory
          .getAll()
          .filter((item) => item.uid !== caseUid && item.uid !== keyUid)
          .map((item) => [item.uid, item])
      )
    );
    setInventory(
      inventory.unlockContainer(unlockedItem.actual, caseUid, keyUid)
    );
    unlockedItemRef.current = undefined;
    return unlockedUid;
  }

  function handleClose() {
    if (isClosingRef.current) {
      return;
    }
    isClosingRef.current = true;
    addUnlockedItemToInventory();
    setIsOpen(false);
  }

  function handleUnlockComplete() {
    const rarity = unlockedItemRef.current?.actual.rarity;
    const unlockedUid = addUnlockedItemToInventory();
    if (unlockedUid !== undefined) {
      playSound(
        `case_awarded_${rarity as "common" | "uncommon" | "rare" | "mythical" | "legendary" | "ancient"}`
      );
      onInspect(unlockedUid);
    }
    handleClose();
  }

  async function handleUnlock() {
    try {
      setIsDisplaying(false);
      setCanUnlock(false);
      const actualItem =
        user === undefined
          ? caseItem.unlockContainer()
          : await unlockCase(caseUid, keyUid);
      const displayedItem = fakeOdds.toBoolean()
        ? caseItem.unlockContainer({
            computeOdds: (rarities) => rarities.map(() => 1)
          })
        : actualItem;
      unlockedItemRef.current = {
        actual: actualItem,
        displayed: displayedItem
      };
      if (isClosingRef.current) {
        addUnlockedItemToInventory();
        return;
      }
      wait(() => {
        setHideCaseContents(true);
        if (caseItem.keyIds !== undefined) {
          playSound("case_unlock");
        }
        wait(() => {
          setItems(
            range(32).map((_, index) =>
              index === 28 ? displayedItem : unlockNonSpecialItem(caseItem)
            )
          );
          setIsDisplaying(true);
          wait(handleUnlockComplete, 6000);
        }, 100);
      }, 250);
    } catch {
      dispatchSyncError();
      handleClose();
    }
  }

  useKeyRelease("Escape", handleClose);

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <Presence present={isOpen} onExitComplete={onClose}>
            <InGameOverlay
              header={
                <UseItemHeader
                  actionDesc={translate("CaseUnlock")}
                  actionItem={nameItemString(caseItem)}
                  title={translate("CaseUnlockContainer")}
                />
              }
            >
              <UnlockCaseContainer
                canUnlock={canUnlock}
                caseItem={caseItem}
                caseUid={caseUid}
                hideCaseContents={hideCaseContents}
                isDisplaying={isDisplaying}
                isSyncing={isSyncing}
                items={items}
                keyItem={keyItem}
                neededKeyItem={neededKeyItem}
                onClose={handleClose}
                onUnlock={handleUnlock}
              />
            </InGameOverlay>
          </Presence>,
          document.body
        )
      }
    />
  );
}
