/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Modal } from "./modal";

export function StickerPickerEditor() {
  return (
    <Modal className="w-[540px] pb-1" blur>
      <div className="flex select-none justify-between px-4 py-2 font-bold">
        <label className="text-sm text-neutral-400">Edit Stickers</label>
        <button className="cursor-default text-white/50 hover:text-white">
          <FontAwesomeIcon icon={faXmark} className="h-4" />
        </button>
      </div>
    </Modal>
  );
}
