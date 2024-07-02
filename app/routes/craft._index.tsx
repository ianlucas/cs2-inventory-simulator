/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS2BaseInventoryItem, CS2EconomyItem } from "@ianlucas/cs2-lib";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useNavigate } from "@remix-run/react";
import clsx from "clsx";
import { useState } from "react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { z } from "zod";
import { useInventory, useLocalize } from "~/components/app-context";
import { useIsDesktop } from "~/components/hooks/use-is-desktop";
import { useLockScroll } from "~/components/hooks/use-lock-scroll";
import { useSync } from "~/components/hooks/use-sync";
import { ItemEditor, ItemEditorAttributes } from "~/components/item-editor";
import { ItemPicker } from "~/components/item-picker";
import { Modal } from "~/components/modal";
import { middleware } from "~/http.server";
import { getMetaTitle } from "~/root-meta";
import { isItemCountable } from "~/utils/economy";
import { deleteEmptyProps } from "~/utils/misc";
import { range } from "~/utils/number";
import { playSound } from "~/utils/sound";
import { AddAction, EditAction } from "./api.action.sync._index";

export const meta = getMetaTitle("HeaderCraftLabel");

export async function loader({ request }: LoaderFunctionArgs) {
  await middleware(request);
  const url = new URL(request.url);
  return typedjson({
    uid: z
      .string()
      .optional()
      .transform((uid) => (uid !== undefined ? Number(uid) : uid))
      .parse(url.searchParams.get("uid") || undefined)
  });
}

export default function Craft() {
  const { uid } = useTypedLoaderData<typeof loader>();
  const isEditing = uid !== undefined;
  const [inventory, setInventory] = useInventory();
  const localize = useLocalize();
  const sync = useSync();
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<CS2EconomyItem | undefined>(
    isEditing ? inventory.get(uid) : undefined
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
          statTrak: statTrak ? inventory.get(uid).statTrak ?? 0 : undefined
        })
      );
      sync({
        type: EditAction,
        uid,
        attributes: inventoryItem
      });
      return navigate("/");
    }

    range(isItemCountable(selectedItem) ? quantity : 1).forEach(() => {
      setInventory(inventory.add(inventoryItem));
      sync({
        type: AddAction,
        item: inventoryItem
      });
    });
    return navigate("/");
  }

  function handleReset() {
    if (isEditing) {
      return navigate("/");
    }
    return setSelectedItem(undefined);
  }

  const isPickingItem = selectedItem === undefined;

  return (
    <Modal
      className={clsx(
        isPickingItem ? (isDesktop ? "w-[720px]" : "w-[540px]") : "w-[420px]"
      )}
    >
      <div className="flex select-none items-center justify-between px-4 py-2 text-sm font-bold">
        <span className="text-neutral-400">
          {isPickingItem
            ? localize("CraftSelectHeader")
            : localize("CraftConfirmHeader")}
        </span>
        <div className="flex items-center">
          <Link className="opacity-50 hover:opacity-100" to="/">
            <FontAwesomeIcon icon={faXmark} className="h-4" />
          </Link>
        </div>
      </div>
      {isPickingItem ? (
        <ItemPicker onPickItem={setSelectedItem} />
      ) : (
        <ItemEditor
          attributes={isEditing ? inventory.get(uid).asBase() : undefined}
          dismissType={isEditing ? "cancel" : "reset"}
          item={selectedItem}
          onDismiss={handleReset}
          onSubmit={handleSubmit}
        />
      )}
    </Modal>
  );
}
