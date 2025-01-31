/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2BaseInventoryItem, CS2EconomyItem } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import lzstring from "lz-string";
import { useState } from "react";
import { data, useLoaderData, useNavigate } from "react-router";
import { z } from "zod";
import { useInventory, useLocalize } from "~/components/app-context";
import { CraftEdit } from "~/components/craft-edit";
import { CraftNew } from "~/components/craft-new";
import { CraftView } from "~/components/craft-view";
import { useIsDesktop } from "~/components/hooks/use-is-desktop";
import { useLockScroll } from "~/components/hooks/use-lock-scroll";
import { useSync } from "~/components/hooks/use-sync";
import { ItemEditorAttributes } from "~/components/item-editor";
import { ItemPicker } from "~/components/item-picker";
import { Modal, ModalHeader } from "~/components/modal";
import { SyncAction } from "~/data/sync";
import { middleware } from "~/http.server";
import { getUserBasicData } from "~/models/user.server";
import { getMetaTitle } from "~/root-meta";
import { isItemCountable } from "~/utils/economy";
import { createFakeInventoryItemFromBase } from "~/utils/inventory";
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
  const [inventory, setInventory] = useInventory();
  const localize = useLocalize();
  const sync = useSync();
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<CS2EconomyItem | undefined>(
    isEditing
      ? inventory.get(uid)
      : isSharing
        ? createFakeInventoryItemFromBase(shared.item)
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
    <>
      {!isEditing && !isSharing && (
        <Modal
          className={clsx(
            isDesktop ? "min-w-[640px] max-w-[720px]" : "w-[540px]"
          )}
        >
          <ModalHeader title={localize("CraftSelectHeader")} linkTo="/" />
          <ItemPicker onPickItem={setSelectedItem} />
        </Modal>
      )}
      {!isPickingItem && (
        <Modal className="w-[420px] transition-[width]">
          <ModalHeader
            title={localize(
              isSharing ? "CraftSharedHeader" : "CraftConfirmHeader"
            )}
            onClose={handleReset}
          />
          {shared?.user !== undefined && (
            <div className="flex items-center gap-2 px-4 py-2 text-sm">
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
          {isEditing ? (
            <CraftEdit
              item={selectedItem}
              onSubmit={handleSubmit}
              onCancel={handleReset}
            />
          ) : isSharing ? (
            <CraftView
              item={selectedItem}
              onCancel={handleReset}
              onSubmit={handleSubmit}
            />
          ) : (
            <CraftNew
              item={selectedItem}
              onSubmit={handleSubmit}
              onCancel={handleReset}
            />
          )}
        </Modal>
      )}
    </>
  );
}
