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
import { useInventory, useTranslate } from "~/components/app-context";
import { CraftEdit } from "~/components/craft-edit";
import { CraftNew } from "~/components/craft-new";
import { CraftShareUser } from "~/components/craft-share-user";
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
  const isCrafting = !isEditing && !isSharing;

  const translate = useTranslate();
  const sync = useSync();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  const [inventory, setInventory] = useInventory();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [item, setItem] = useState<CS2EconomyItem | undefined>(
    isEditing
      ? inventory.get(uid)
      : isSharing
        ? createFakeInventoryItemFromBase(shared.item)
        : undefined
  );

  useLockScroll();

  function handleSubmit({
    quantity,
    statTrak,
    ...attributes
  }: ItemEditorAttributes) {
    if (isSubmitting || item === undefined) {
      return;
    }
    playSound("inventory_new_item_accept");
    setIsSubmitting(true);

    const inventoryItem = {
      id: item.id,
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

    range(isItemCountable(item) ? quantity : 1).forEach(() => {
      setInventory(inventory.add(inventoryItem));
      sync({
        type: SyncAction.Add,
        item: inventoryItem
      });
    });
    return navigate("/");
  }

  function handleClose() {
    if (isEditing || isSharing) {
      return navigate("/");
    }
    return setItem(undefined);
  }

  const editorProps =
    item !== undefined
      ? {
          item,
          onSubmit: handleSubmit,
          onClose: handleClose
        }
      : undefined;
  const hasItem = editorProps !== undefined;

  const CraftComponent = isEditing
    ? CraftEdit
    : isSharing
      ? CraftView
      : CraftNew;

  return (
    <>
      {isCrafting && (
        <Modal
          className={clsx(
            isDesktop ? "max-w-[720px] min-w-[640px]" : "w-[540px]"
          )}
        >
          <ModalHeader title={translate("CraftSelectHeader")} linkTo="/" />
          <ItemPicker onPickItem={setItem} />
        </Modal>
      )}
      {hasItem && (
        <Modal className="w-[420px]">
          <ModalHeader
            title={translate(
              isSharing ? "CraftSharedHeader" : "CraftConfirmHeader"
            )}
            onClose={handleClose}
          />
          {shared?.user !== undefined && <CraftShareUser user={shared.user} />}
          <CraftComponent {...editorProps} />
        </Modal>
      )}
    </>
  );
}
