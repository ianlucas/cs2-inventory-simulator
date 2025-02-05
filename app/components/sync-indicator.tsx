/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Inventory } from "@ianlucas/cs2-lib";
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
import { useInventory, useLocalize, useRules } from "./app-context";
import { FillSpinner } from "./fill-spinner";
import { Modal, ModalHeader } from "./modal";
import { ModalButton } from "./modal-button";

export function SyncIndicator() {
  const localize = useLocalize();
  const { inventoryMaxItems, inventoryStorageUnitMaxItems } = useRules();
  const [, setInventory] = useInventory();
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
        new CS2Inventory({
          data: parseInventory(inventory),
          maxItems: inventoryMaxItems,
          storageUnitMaxItems: inventoryStorageUnitMaxItems
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
              className="pointer-events-none fixed right-8 bottom-8 transition-all"
              style={{ opacity }}
            >
              <FillSpinner />
            </div>
            {showSyncErrorModal && (
              <Modal fixed>
                <ModalHeader title={localize("SyncErrorTitle")} />
                <p className="mt-2 px-4">{localize("SyncErrorDesc")}</p>
                <div className="my-6 mt-4 flex justify-center px-4">
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
                        localize("SyncErrorContinue")
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
