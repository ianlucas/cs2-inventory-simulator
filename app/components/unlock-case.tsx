/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2UnlockedItem } from "@ianlucas/cs2-lib";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import {
  useInventoryItem,
  useTryInventoryItem
} from "~/components/hooks/use-inventory-item";
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
import { useInventory, useUser } from "./app-context";
import { useKeyRelease } from "./hooks/use-key-release";
import { useIsSyncing } from "./hooks/use-sync-state";
import { Overlay } from "./overlay";
import { UnlockCaseContainer } from "./unlock-case-container";
import { UnlockCaseContainerUnlocked } from "./unlock-case-container-unlocked";

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
  onClose
}: {
  caseUid: number;
  keyUid?: number;
  onClose: () => void;
}) {
  const user = useUser();
  const isSyncing = useIsSyncing();
  const [inventory, setInventory] = useInventory();
  const [items, setItems] = useState<CS2UnlockedItem[]>([]);
  const [isDisplaying, setIsDisplaying] = useState(false);
  const [canUnlock, setCanUnlock] = useState(true);
  const [unlockedItem, setUnlockedItem] = useState<CS2UnlockedItem>();
  const [hideCaseContents, setHideCaseContents] = useState(false);
  const unlockedItemRef = useRef<CS2UnlockedItem>();

  const caseItem = useInventoryItem(caseUid);
  const neededKeyItem =
    caseItem.keys !== undefined
      ? CS2Economy.getById(caseItem.keys[0])
      : undefined;
  const keyItem = useTryInventoryItem(keyUid);
  const wait = useTimer();

  function addUnlockedItemToInventory() {
    const unlockedItem = unlockedItemRef.current;
    if (unlockedItem === undefined) {
      return;
    }
    setUnlockedItem(unlockedItem);
    setInventory(inventory.unlockContainer(unlockedItem, caseUid, keyUid));
    unlockedItemRef.current = undefined;
  }

  function handleClose() {
    addUnlockedItemToInventory();
    onClose();
  }

  async function handleUnlock() {
    try {
      setIsDisplaying(false);
      setCanUnlock(false);
      const unlockedItem =
        user === undefined
          ? caseItem.unlockContainer()
          : await unlockCase(caseUid, keyUid);
      unlockedItemRef.current = unlockedItem;
      wait(() => {
        setHideCaseContents(true);
        if (caseItem.keys !== undefined) {
          playSound("case_unlock");
        }
        wait(() => {
          setItems(
            range(32).map((_, index) =>
              index === 28 ? unlockedItem : unlockNonSpecialItem(caseItem)
            )
          );
          setIsDisplaying(true);
          wait(addUnlockedItemToInventory, 6000);
        }, 100);
      }, 250);
    } catch {
      dispatchSyncError();
      onClose();
    }
  }

  useKeyRelease("Escape", handleClose);

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <Overlay isWrapperless>
            {unlockedItem ? (
              <UnlockCaseContainerUnlocked
                caseItem={caseItem}
                onClose={onClose}
                unlockedItem={unlockedItem}
              />
            ) : (
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
            )}
          </Overlay>,
          document.body
        )
      }
    />
  );
}
