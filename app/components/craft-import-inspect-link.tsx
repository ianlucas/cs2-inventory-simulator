/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2BaseInventoryItem } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { isValidInspectLink, normalizeInspectLink } from "~/utils/economy";
import { useTranslate } from "./app-context";
import { EditorInput } from "./editor-input";
import { FillSpinner } from "./fill-spinner";
import { ModalHeader } from "./modal";
import { ModalButton } from "./modal-button";
import { alert } from "./modal-generic";

const importErrorMapping = {
  400: "CraftImportError400",
  429: "CraftImportError429",
  500: "CraftImportError500",
  502: "CraftImportError502",
  503: "CraftImportError500"
} as const;

function useImportInspectLink() {
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  async function importInspectLink(inspectLink: string) {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoading(true);
    try {
      const response = await fetch("/api/action/import-inspect-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inspectLink }),
        signal: controller.signal
      });
      return {
        status: response.status,
        data: response.ok ? await response.json() : null
      };
    } finally {
      setIsLoading(false);
    }
  }

  return { importInspectLink, isLoading };
}

export function CraftImportInspectLink({
  onClose,
  onImport
}: {
  onClose: () => void;
  onImport: (item: CS2BaseInventoryItem) => void;
}) {
  const translate = useTranslate();
  const [inspectLink, setInspectLink] = useState("");
  const normalizedInspectLink = useMemo(
    () => normalizeInspectLink(inspectLink),
    [inspectLink]
  );
  const canInspectLink = useMemo(
    () => isValidInspectLink(normalizedInspectLink),
    [normalizedInspectLink]
  );
  const { importInspectLink, isLoading: isImportingInspectLink } =
    useImportInspectLink();

  async function handleImport() {
    const result = await importInspectLink(normalizedInspectLink);
    if (result === undefined) {
      return;
    }
    if (!result.data) {
      await alert({
        titleText: translate("CraftImportFailedTitle"),
        bodyText: translate(
          importErrorMapping[
            result.status as keyof typeof importErrorMapping
          ] ?? "CraftImportErrorUnknown"
        ),
        closeText: translate("CraftImportFailedClose")
      });
      return;
    }
    onImport(result.data);
  }

  return (
    <>
      <ModalHeader title={translate("CraftImportHeader")} />
      <div className="p-1">
        <EditorInput
          readOnly={isImportingInspectLink}
          className="w-full"
          placeholder={translate("CraftImportPlaceholder")}
          validate={(value) =>
            value === undefined ||
            value === "" ||
            isValidInspectLink(normalizeInspectLink(value))
          }
          onChange={(event) => setInspectLink(event.target.value)}
          value={inspectLink}
        />
      </div>
      <div className="my-6 flex justify-center gap-2">
        <ModalButton
          onClick={onClose}
          children={translate("EditorCancel")}
          variant="secondary"
          disabled={isImportingInspectLink}
        />
        <ModalButton
          onClick={handleImport}
          children={
            <>
              <div
                className={clsx(
                  "absolute top-0 left-0 flex h-full w-full items-center justify-center transition-all",
                  isImportingInspectLink ? "opacity-100" : "opacity-0"
                )}
              >
                <FillSpinner />
              </div>
              <span
                className={isImportingInspectLink ? "opacity-0" : "opacity-100"}
              >
                {translate("CraftImportButton")}
              </span>
            </>
          }
          variant="primary"
          disabled={!canInspectLink || isImportingInspectLink}
        />
      </div>
    </>
  );
}
