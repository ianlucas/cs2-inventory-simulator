/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { Modal } from "./modal";
import { ModalButton } from "./modal-button";

export async function alert({
  titleText,
  bodyText,
  closeText
}: {
  titleText: string;
  bodyText: string;
  closeText: string;
}) {
  const root = createRoot(document.createElement("div"));
  root.render(
    createPortal(
      <Modal className="w-[550px]" fixed>
        <div className="px-4 py-2 text-sm font-bold">
          <span className="text-neutral-400">{titleText}</span>
        </div>
        <p className="px-4">{bodyText}</p>
        <div className="flex justify-end px-4 py-2">
          <ModalButton
            onClick={() => root.unmount()}
            variant="secondary"
            children={closeText}
          />
        </div>
      </Modal>,
      document.body
    )
  );
}
