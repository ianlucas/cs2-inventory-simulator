/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useNavigate } from "@remix-run/react";
import clsx from "clsx";
import { useState } from "react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { z } from "zod";
import {
  CSItemEditor,
  CSItemEditorAttributes
} from "~/components/cs-item-editor";
import { CSItemPicker } from "~/components/cs-item-picker";
import { Modal } from "~/components/modal";
import { useRootContext } from "~/components/root-context";
import { useIsDesktop } from "~/hooks/use-is-desktop";
import { useLockScroll } from "~/hooks/use-lock-scroll";
import { useSync } from "~/hooks/use-sync";
import { useTranslation } from "~/hooks/use-translation";
import { middleware } from "~/http.server";
import { showQuantity } from "~/utils/economy";
import { range } from "~/utils/number";
import { playSound } from "~/utils/sound";
import { AddAction, EditAction } from "./api.action.sync._index";

export const meta: MetaFunction = () => {
  return [{ title: "Craft - CS2 Inventory Simulator" }];
};

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
  const { inventory, setInventory } = useRootContext();
  const sync = useSync();
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState(
    uid !== undefined ? inventory.get(uid).data : undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const translate = useTranslation();
  const isDesktop = useIsDesktop();

  useLockScroll();

  function handleSubmit({
    quantity,
    stattrak,
    ...attributes
  }: CSItemEditorAttributes) {
    if (isSubmitting || selectedItem === undefined) {
      return;
    }
    playSound("inventory_new_item_accept");
    setIsSubmitting(true);

    const inventoryItem = {
      id: selectedItem.id,
      stattrak: stattrak ? (0 as const) : undefined,
      ...attributes
    };

    if (uid !== undefined) {
      setInventory(
        inventory.edit(uid, {
          ...inventoryItem,
          stattrak: stattrak ? inventory.get(uid).stattrak ?? 0 : undefined
        })
      );
      sync({
        type: EditAction,
        uid,
        attributes: inventoryItem
      });
      return navigate("/");
    }

    range(showQuantity(selectedItem) ? quantity : 1).forEach(() => {
      setInventory(inventory.add(inventoryItem));
      sync({
        type: AddAction,
        item: inventoryItem
      });
    });
    return navigate("/");
  }

  function handleReset() {
    if (uid !== undefined) {
      return navigate("/");
    }
    return setSelectedItem(undefined);
  }

  const isPickingItem = selectedItem === undefined;

  return (
    <Modal
      className={clsx(
        isPickingItem ? (isDesktop ? "w-[640px]" : "w-[540px]") : "w-[420px]"
      )}
    >
      <div className="flex select-none items-center justify-between px-4 py-2 text-sm font-bold">
        <span className="text-neutral-400">
          {isPickingItem
            ? translate("CraftSelectHeader")
            : translate("CraftConfirmHeader")}
        </span>
        <div className="flex items-center">
          <Link className="opacity-50 hover:opacity-100" to="/">
            <FontAwesomeIcon icon={faXmark} className="h-4" />
          </Link>
        </div>
      </div>
      {isPickingItem ? (
        <CSItemPicker onPickItem={setSelectedItem} />
      ) : (
        <CSItemEditor
          item={selectedItem}
          attributes={uid !== undefined ? inventory.get(uid) : undefined}
          onSubmit={handleSubmit}
          onReset={handleReset}
        />
      )}
    </Modal>
  );
}
