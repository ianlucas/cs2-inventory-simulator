/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faShareNodes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { useTranslate } from "./app-context";
import { useTimedState } from "./hooks/use-timed-state";

export function InventoryShareButton({ path }: { path: string }) {
  const translate = useTranslate();
  const [, copyToClipboard] = useCopyToClipboard();
  const [copied, triggerCopied] = useTimedState(2000);

  function handleClick() {
    copyToClipboard(`${window.location.origin}${path}`);
    triggerCopied();
  }

  return (
    <button
      className="font-display flex cursor-default items-center gap-3 rounded-xs px-2 py-1 text-sm transition-all hover:bg-neutral-500/40"
      onClick={handleClick}
    >
      <FontAwesomeIcon className="h-4 text-white" icon={faShareNodes} />
      {copied ? translate("InventoryShareCopied") : translate("InventoryShare")}
    </button>
  );
}
