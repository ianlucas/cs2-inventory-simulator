/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { isValidInspectLink, normalizeInspectLink } from "~/utils/economy";
import { useTranslate } from "./app-context";
import { EditorInput } from "./editor-input";
import { FillSpinner } from "./fill-spinner";
import { alert } from "./modal-generic";
import { ModalHeader } from "./modal";
import { ModalButton } from "./modal-button";

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

const errorMessages: Record<number, string> = {
  400: "The inspect link is invalid.",
  500: "We can't import this type of inspect link right now.",
  502: "Failed to fetch inspect link data, please try again.",
  503: "We can't import this type of inspect link right now."
};

export function CraftImportInspectLink({ onClose }: { onClose: () => void }) {
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
        titleText: "Import failed",
        bodyText:
          errorMessages[result.status] ?? "An unexpected error occurred.",
        closeText: "OK"
      });
      return;
    }
    console.log(result.data);
  }

  return (
    <>
      <ModalHeader title="Import from a inspect link" />
      <div className="p-1">
        <EditorInput
          readOnly={isImportingInspectLink}
          className="w-full"
          placeholder="Paste the inspect link here..."
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
                Import
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
