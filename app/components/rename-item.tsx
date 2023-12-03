/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faCircleInfo, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS_filterItems,
  CS_Item,
  CS_NAMETAG_RE,
  CS_resolveItemImage,
  CS_safeValidateNametag
} from "@ianlucas/cslib";
import clsx from "clsx";
import { ComponentProps, useMemo } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useInput } from "~/hooks/use-input";
import { useSync } from "~/hooks/use-sync";
import { useTranslation } from "~/hooks/use-translation";
import { baseUrl } from "~/utils/economy";
import { EditorInput } from "./editor-input";
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

export function RenameItem({
  onClose,
  targetIndex,
  targetItem,
  toolIndex
}: {
  onClose(): void;
  targetIndex: number;
  targetItem: CS_Item;
  toolIndex: number;
}) {
  const translate = useTranslation();
  const [nametag, setNametag] = useInput("");
  const { setInventory } = useRootContext();
  const sync = useSync();
  const freeItems = useMemo(
    () =>
      CS_filterItems({
        free: true
      }).map((item) => item.id),
    []
  );
  const isRenamingFreeItem = freeItems.includes(targetItem.id);
  function handleRename() {
    if (targetIndex < 0 && isRenamingFreeItem) {
      const itemToAdd = { id: targetItem.id, nametag };
      sync("remove", { index: toolIndex });
      sync("add", { item: itemToAdd });
      setInventory((inventory) => inventory.remove(toolIndex).add(itemToAdd));
    } else {
      sync("renameItem", {
        toolIndex,
        targetIndex,
        nametag
      });
      setInventory((inventory) =>
        inventory.renameItem(toolIndex, targetIndex, nametag)
      );
    }

    onClose();
  }

  return (
    <ClientOnly>
      {() =>
        createPortal(
          <Layer
            className={clsx("z-50 select-none bg-black/60 backdrop-blur-sm")}
          >
            <div>
              <div className="text-center">
                <div className="text-2xl">{translate("RenameUse")}</div>
                <div className="text-lg">
                  {translate("RenameEnterName")} {targetItem.name}
                </div>
                <div className="mt-2 flex items-center justify-center gap-2 text-sm">
                  <FontAwesomeIcon icon={faCircleInfo} className="h-3" />
                  <span>{translate("RenameWarn")}</span>
                </div>
              </div>
              <img
                className="aspect-[1.33333] max-w-[512px]"
                draggable={false}
                src={CS_resolveItemImage(baseUrl, targetItem)}
              />
              <div className="flex">
                <EditorInput
                  value={nametag}
                  placeholder={translate("EditorNametagPlaceholder")}
                  onChange={setNametag}
                  pattern={CS_NAMETAG_RE}
                  maxLength={20}
                  className="py-1 text-xl"
                />
              </div>
              <div className="mt-4 flex justify-end gap-4">
                <button
                  className="flex cursor-default items-center gap-2 rounded bg-white/80 px-4 py-2 font-bold text-neutral-700 drop-shadow-lg transition hover:bg-white disabled:bg-neutral-500 disabled:text-neutral-700"
                  onClick={onClose}
                >
                  <FontAwesomeIcon icon={faXmark} className="h-4" />
                  {translate("RenameCancel")}
                </button>
                <button
                  disabled={
                    (nametag !== "" && !CS_safeValidateNametag(nametag)) ||
                    (nametag === "" && isRenamingFreeItem)
                  }
                  className="flex cursor-default items-center gap-2 rounded bg-green-700/80 px-4 py-2 font-bold text-neutral-200 drop-shadow-lg transition hover:bg-green-600 disabled:bg-green-900 disabled:text-green-600"
                  onClick={handleRename}
                >
                  {translate("RenameRename")}
                </button>
              </div>
            </div>
          </Layer>,
          document.body
        )
      }
    </ClientOnly>
  );
}
