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
import { sync } from "~/sync";
import { getJson } from "~/utils/fetch";
import { parseInventory } from "~/utils/inventory";
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
  const [showSyncErrorModal, setShowSyncErrorModal] = useState(false);
  const [disableContinueButton, setDisableContinueButton] = useState(false);

  function handleClose() {
    setShowSyncErrorModal(false);
  }

  useEffect(() => {
    function handleSyncStart() {
      setOpacity(1);
    }
    function handleSyncEnd() {
      setOpacity(0);
    }
    async function handleSyncError() {
      setDisableContinueButton(true);
      setShowSyncErrorModal(true);
      const { syncedAt, inventory } =
        await getJson<ApiActionResyncData>(ApiActionResyncUrl);
      setInventory(
        new CS_Inventory({
          items: parseInventory(inventory),
          maxItems: rules.inventoryMaxItems,
          storageUnitMaxItems: rules.inventoryStorageUnitMaxItems
        })
      );
      sync.syncedAt = syncedAt;
      setDisableContinueButton(false);
    }
    sync.addEventListener("syncstart", handleSyncStart);
    sync.addEventListener("syncend", handleSyncEnd);
    sync.addEventListener("syncerror", handleSyncError);
    return () => {
      sync.removeEventListener("syncstart", handleSyncStart);
      sync.removeEventListener("syncend", handleSyncEnd);
      sync.removeEventListener("syncerror", handleSyncError);
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
            {showSyncErrorModal && (
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
