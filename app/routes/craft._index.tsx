/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import lzstring from "lz-string";
import { useState } from "react";
import { data, Link, useLoaderData, useNavigate } from "react-router";
import { z } from "zod";
import { useInventory, useLocalize, useRules } from "~/components/app-context";
import { useIsDesktop } from "~/components/hooks/use-is-desktop";
import { useLockScroll } from "~/components/hooks/use-lock-scroll";
import { useSync } from "~/components/hooks/use-sync";
import { ItemEditor, ItemEditorAttributes } from "~/components/item-editor";
import { ItemPicker } from "~/components/item-picker";
import { Modal } from "~/components/modal";
import { SyncAction } from "~/data/sync";
import { middleware } from "~/http.server";
import { getUserBasicData } from "~/models/user.server";
import { getMetaTitle } from "~/root-meta";
import { isItemCountable } from "~/utils/economy";
import { deleteEmptyProps } from "~/utils/misc";
import { range } from "~/utils/number";
import { baseInventoryItemProps } from "~/utils/shapes";
import { playSound } from "~/utils/sound";
import type { Route } from "./+types/craft._index";

export const meta = getMetaTitle("HeaderCraftLabel");

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);
  const url = new URL(request.url);
  const share = url.searchParams.get("share");
  const shared = z
    .object({
      i: z.object({
        ...baseInventoryItemProps,
        statTrak: z
          .number()
          .optional()
          .transform((statTrak) =>
            statTrak !== undefined ? (0 as const) : undefined
          )
      }),
      u: z.string().optional()
    })
    .optional()
    .parse(
      share !== null
        ? JSON.parse(lzstring.decompressFromEncodedURIComponent(share))
        : undefined
    );
  return data({
    shared:
      shared !== undefined
        ? {
            item: shared.i,
            user:
              shared.u !== undefined
                ? await getUserBasicData(shared.u)
                : undefined
          }
        : undefined,
    uid: z
      .string()
      .optional()
      .transform((uid) => (uid !== undefined ? Number(uid) : uid))
      .parse(url.searchParams.get("uid") || undefined)
  });
}

export default function Craft() {
  const { uid, shared } = useLoaderData<typeof loader>();
  const isEditing = uid !== undefined;
  const isSharing = shared?.item !== undefined;
  const { craftMaxQuantity } = useRules();
  const [inventory, setInventory] = useInventory();
  const localize = useLocalize();
  const sync = useSync();
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<CS2EconomyItem | undefined>(
    isEditing
      ? inventory.get(uid)
      : isSharing
        ? CS2Economy.get(shared.item.id)
        : undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDesktop = useIsDesktop();

  useLockScroll();

  function handleSubmit({
    quantity,
    statTrak,
    ...attributes
  }: ItemEditorAttributes) {
    if (isSubmitting || selectedItem === undefined) {
      return;
    }
    playSound("inventory_new_item_accept");
    setIsSubmitting(true);

    const inventoryItem = {
      id: selectedItem.id,
      statTrak: statTrak ? (0 as const) : undefined,
      ...attributes
    } satisfies CS2BaseInventoryItem;

    if (isEditing) {
      deleteEmptyProps(inventoryItem);
      setInventory(
        inventory.edit(uid, {
          ...inventoryItem,
          statTrak: statTrak ? (inventory.get(uid).statTrak ?? 0) : undefined
        })
      );
      sync({
        type: SyncAction.Edit,
        uid,
        attributes: inventoryItem
      });
      return navigate("/");
    }

    range(isItemCountable(selectedItem) ? quantity : 1).forEach(() => {
      setInventory(inventory.add(inventoryItem));
      sync({
        type: SyncAction.Add,
        item: inventoryItem
      });
    });
    return navigate("/");
  }

  function handleReset() {
    if (isEditing || isSharing) {
      return navigate("/");
    }
    return setSelectedItem(undefined);
  }

  const isPickingItem = selectedItem === undefined;

  return (
    <Modal
      className={clsx(
        "transition-[width]",
        isPickingItem ? (isDesktop ? "w-[720px]" : "w-[540px]") : "w-[420px]"
      )}
    >
      <div className="flex select-none items-center justify-between px-4 py-2 text-sm font-bold">
        <span className="text-neutral-400">
          {localize(
            isSharing
              ? "CraftSharedHeader"
              : isPickingItem
                ? "CraftSelectHeader"
                : "CraftConfirmHeader"
          )}
        </span>
        <div className="flex items-center">
          <Link className="opacity-50 hover:opacity-100" to="/">
            <FontAwesomeIcon icon={faXmark} className="h-4" />
          </Link>
        </div>
      </div>
      {shared?.user !== undefined && (
        <div className="flex items-center gap-2 px-4 text-sm">
          <span className="text-neutral-500">{localize("CraftBy")}</span>
          <img
            className="h-6 w-6 rounded-full"
            src={shared.user.avatar}
            alt={shared.user.name}
            draggable={false}
          />
          <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {shared.user.name}
          </span>
        </div>
      )}
      {isPickingItem ? (
        <ItemPicker onPickItem={setSelectedItem} />
      ) : (
        <ItemEditor
          attributes={
            isEditing
              ? inventory.get(uid).asBase()
              : isSharing
                ? shared.item
                : undefined
          }
          disabled={isSharing}
          type={isEditing ? "edit" : isSharing ? "share" : "craft"}
          item={selectedItem}
          maxQuantity={craftMaxQuantity !== 0 ? craftMaxQuantity : undefined}
          onDismiss={handleReset}
          onSubmit={handleSubmit}
        />
      )}
    </Modal>
  );
}
