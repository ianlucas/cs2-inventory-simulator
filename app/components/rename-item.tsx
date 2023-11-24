/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faCircleInfo, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS_filterItems, CS_Item, CS_NAMETAG_RE, CS_resolveItemImage, CS_safeValidateNametag } from "@ianlucas/cslib";
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
  const freeItems = useMemo(() =>
    CS_filterItems({
      free: true
    }).map(csItem => csItem.id), []);
  const isRenamingFreeItem = freeItems.includes(targetItem.id);
  function handleRename() {
    if (targetIndex < 0 && isRenamingFreeItem) {
      const itemToAdd = { id: targetItem.id, nametag };
      sync("remove", { toolIndex });
      sync("add", itemToAdd);
      setInventory(inventory => inventory.remove(toolIndex).add(itemToAdd));
    } else {
      sync("renameItem", {
        toolIndex,
        targetIndex,
        nametag
      });
      setInventory(inventory =>
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
            className={clsx(
              "z-50 backdrop-blur-sm bg-black/60 select-none"
            )}
          >
            <div>
              <div className="text-center">
                <div className="text-2xl">{translate("RenameUse")}</div>
                <div className="text-lg">
                  {translate("RenameEnterName")} {targetItem.name}
                </div>
                <div className="flex items-center justify-center gap-2 text-sm mt-2">
                  <FontAwesomeIcon icon={faCircleInfo} className="h-3" />
                  <span>{translate("RenameWarn")}</span>
                </div>
              </div>
              <img
                className="max-w-[512px] aspect-[1.33333]"
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
                  className="text-xl py-1"
                />
              </div>
              <div className="flex justify-end mt-4 gap-4">
                <button
                  className="flex items-center gap-2 bg-white/80 hover:bg-white text-neutral-700 px-4 py-2 rounded font-bold drop-shadow-lg transition disabled:bg-neutral-500 disabled:text-neutral-700 cursor-default"
                  onClick={onClose}
                >
                  <FontAwesomeIcon
                    icon={faXmark}
                    className="h-4"
                  />
                  {translate("RenameCancel")}
                </button>
                <button
                  disabled={(nametag !== "" && !CS_safeValidateNametag(nametag))
                    || (nametag === "" && isRenamingFreeItem)}
                  className="flex items-center gap-2 bg-green-700/80 hover:bg-green-600 text-neutral-200 px-4 py-2 rounded font-bold drop-shadow-lg transition disabled:bg-green-900 disabled:text-green-600 cursor-default"
                  onClick={handleRename}
                >
                  {translate("RenameRename")}
                </button>
              </div>
            </div>
          </Layer>,
          document.body
        )}
    </ClientOnly>
  );
}
