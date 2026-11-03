/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2Inventory, CS2_ITEMS, ensure } from "@ianlucas/cs2-lib";
import { english } from "@ianlucas/cs2-lib/translations/english";
import { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { UnlockCase } from "./unlock-case";
import type { UnlockCaseContainer } from "./unlock-case-container";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

CS2Economy.load({
  items: CS2_ITEMS,
  language: english
});

const context = vi.hoisted(() => ({
  containerProps: undefined as
    ComponentProps<typeof UnlockCaseContainer> | undefined,
  dispatchSyncError: vi.fn(),
  inventory: undefined as CS2Inventory | undefined,
  postJson: vi.fn(),
  setInventory: vi.fn()
}));

vi.mock("./app-context", () => ({
  useInventory: () => [context.inventory, context.setInventory],
  useInventoryItems: () => [],
  useTranslate: () => (key: string) => key,
  useUser: () => ({ id: "76561197960287930" })
}));

vi.mock("~/components/hooks/use-name-item", () => ({
  useNameItemString: () => () => ""
}));

vi.mock("./hooks/use-sync-state", () => ({
  useIsSyncing: () => false
}));

vi.mock("./unlock-case-container", () => ({
  UnlockCaseContainer: (props: ComponentProps<typeof UnlockCaseContainer>) => {
    context.containerProps = props;
    return null;
  }
}));

vi.mock("~/routes/api.action.unlock-case._index", () => ({
  ApiActionUnlockCaseUrl: "/api/action/unlock-case"
}));

vi.mock("~/shared/fetch", () => ({
  postJson: context.postJson
}));

vi.mock("~/sync", () => ({
  dispatchSyncError: context.dispatchSyncError,
  sync: { syncedAt: 0 }
}));

vi.mock("~/sound.client", () => ({
  playSound: vi.fn()
}));

const caseItem = ensure(
  CS2Economy.itemsAsArray.find(
    (item) => item.isContainer() && item.keyIds !== undefined
  )
);
const keyItem = CS2Economy.getById(ensure(caseItem.keyIds)[0]);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, reject, resolve };
}

describe("UnlockCase", () => {
  let container: HTMLElement;
  let root: Root;
  let caseUid: number;
  let keyUid: number;

  beforeEach(() => {
    const inventory = new CS2Inventory()
      .add({ id: caseItem.id })
      .add({ id: keyItem.id });
    const uids = inventory.getAll().map(({ id, uid }) => ({ id, uid }));
    caseUid = ensure(uids.find(({ id }) => id === caseItem.id)).uid;
    keyUid = ensure(uids.find(({ id }) => id === keyItem.id)).uid;
    context.inventory = inventory;
    context.containerProps = undefined;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  function render() {
    act(() =>
      root.render(
        <UnlockCase
          caseUid={caseUid}
          keyUid={keyUid}
          onClose={vi.fn()}
          onInspect={vi.fn()}
        />
      )
    );
  }

  function overlayState() {
    return document.body
      .querySelector("[data-state]")
      ?.getAttribute("data-state");
  }

  function pressEscape() {
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "Escape" }));
    });
  }

  function unlock() {
    const response = deferred<object>();
    context.postJson.mockReturnValueOnce(response.promise);
    act(() => {
      ensure(context.containerProps).onUnlock();
    });
    return response;
  }

  function hasItem(id: number) {
    return ensure(context.inventory)
      .getAll()
      .some((item) => item.id === id);
  }

  test("stays open and keeps the case and key until the unlock response lands", async () => {
    render();
    const response = unlock();
    expect(context.containerProps?.isUnlocking).toBe(true);

    pressEscape();
    act(() => ensure(context.containerProps).onClose());
    expect(overlayState()).toBe("open");
    expect(context.setInventory).not.toHaveBeenCalled();

    const unlockedItem = caseItem.unlockContainer();
    await act(async () => response.resolve({ unlockedItem, syncedAt: 1 }));
    expect(context.containerProps?.isUnlocking).toBe(false);

    pressEscape();
    expect(overlayState()).toBe("closed");
    expect(context.setInventory).toHaveBeenCalledOnce();
    expect(hasItem(caseItem.id)).toBe(false);
    expect(hasItem(keyItem.id)).toBe(false);
    expect(hasItem(unlockedItem.id)).toBe(true);
  });

  test("closes without touching the inventory when the unlock fails", async () => {
    render();
    const response = unlock();

    await act(async () => response.reject(new Error("Unlock failed.")));
    expect(context.dispatchSyncError).toHaveBeenCalledOnce();
    expect(overlayState()).toBe("closed");
    expect(context.setInventory).not.toHaveBeenCalled();
    expect(hasItem(caseItem.id)).toBe(true);
    expect(hasItem(keyItem.id)).toBe(true);
  });
});
