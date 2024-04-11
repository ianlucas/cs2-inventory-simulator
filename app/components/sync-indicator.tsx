/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Inventory } from "@ianlucas/cs2-lib";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import {
  ApiActionResyncData,
  ApiActionResyncUrl
} from "~/routes/api.action.resync._index";
import { getJson } from "~/utils/fetch";
import { parseInventory } from "~/utils/inventory";
import { syncEvents, syncState } from "~/utils/sync";
import { FillSpinner } from "./fill-spinner";
import { Modal } from "./modal";
import { ModalButton } from "./modal-button";
import { useRootContext } from "./root-context";

export function SyncIndicator() {
  const {
    setInventory,
    rules,
    translations: { translate }
  } = useRootContext();
  const [opacity, setOpacity] = useState(0);
  const [showSyncFailModal, setShowSyncFailModal] = useState(false);
  const [disableContinueButton, setDisableContinueButton] = useState(false);

  function handleClose() {
    setShowSyncFailModal(false);
  }

  useEffect(() => {
    function handleSyncStart() {
      setOpacity(1);
    }
    function handleSyncEnd() {
      setOpacity(0);
    }
    async function handleSyncFail() {
      setDisableContinueButton(true);
      setShowSyncFailModal(true);
      const { syncedAt, inventory } =
        await getJson<ApiActionResyncData>(ApiActionResyncUrl);
      setInventory(
        new CS_Inventory({
          items: parseInventory(inventory),
          maxItems: rules.inventoryMaxItems,
          storageUnitMaxItems: rules.inventoryStorageUnitMaxItems
        })
      );
      syncState.syncedAt = syncedAt;
      setDisableContinueButton(false);
    }
    syncEvents.addEventListener("syncstart", handleSyncStart);
    syncEvents.addEventListener("syncend", handleSyncEnd);
    syncEvents.addEventListener("syncfail", handleSyncFail);
    return () => {
      syncEvents.removeEventListener("syncstart", handleSyncStart);
      syncEvents.removeEventListener("syncend", handleSyncEnd);
      syncEvents.removeEventListener("syncfail", handleSyncFail);
    };
  }, []);

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <>
            <div
              className="pointer-events-none fixed bottom-8 right-8 transition-all"
              style={{ opacity }}
            >
              <FillSpinner />
            </div>
            {showSyncFailModal && (
              <Modal fixed>
                <div className="px-4 py-2 text-sm font-bold">
                  <span className="text-neutral-400">
                    {translate("SyncErrorTitle")}
                  </span>
                </div>
                <p className="px-4">{translate("SyncErrorDesc")}</p>
                <div className="mt-4 flex justify-end px-4 py-2">
                  <ModalButton
                    disabled={disableContinueButton}
                    onClick={handleClose}
                    variant="primary"
                    children={
                      disableContinueButton ? (
                        <span className="inline-block">
                          <FillSpinner />
                        </span>
                      ) : (
                        translate("SyncErrorContinue")
                      )
                    }
                  />
                </div>
              </Modal>
            )}
          </>,
          document.body
        )
      }
    />
  );
}
