/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router";
import { SyncAction } from "~/data/sync";
import { useInventory, useTranslate } from "./app-context";
import { useSync } from "./hooks/use-sync";
import { confirm } from "./modal-generic";

export function SettingsResetInventory() {
  const [inventory, setInventory] = useInventory();
  const translate = useTranslate();
  const sync = useSync();
  const navigate = useNavigate();

  async function handleRemoveAllItems() {
    if (
      await confirm({
        titleText: translate("SettingsRemoveAllItems"),
        bodyText: translate("SettingsConfirmRemoveAllItems"),
        cancelText: translate("EditorCancel"),
        confirmText: translate("GenericOK")
      })
    ) {
      inventory.removeAll();
      setInventory(inventory);
      sync({ type: SyncAction.RemoveAllItems });
      return navigate("/");
    }
  }

  return (
    <button
      className="font-display flex h-12 w-full cursor-default items-center gap-3 rounded-sm border border-neutral-500/20 bg-neutral-800/50 px-3 py-1 font-bold text-red-500 transition-all hover:ring-2 hover:ring-red-500"
      onClick={handleRemoveAllItems}
    >
      <FontAwesomeIcon icon={faTrashCan} className="h-4" />
      {translate("SettingsRemoveAllItems")}
    </button>
  );
}
