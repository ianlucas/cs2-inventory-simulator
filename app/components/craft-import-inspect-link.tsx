/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { useMemo, useState } from "react";
import { isValidInspectLink, normalizeInspectLink } from "~/utils/economy";
import { useTranslate } from "./app-context";
import { EditorInput } from "./editor-input";
import { FillSpinner } from "./fill-spinner";
import { ModalHeader } from "./modal";
import { ModalButton } from "./modal-button";

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
  const isImportingInspectLink = false;

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
