/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { Modal, ModalHeader } from "./modal";
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
        <ModalHeader title={titleText} />
        <p className="mt-2 px-4 text-sm">{bodyText}</p>
        <div className="my-6 flex justify-center px-4">
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

export async function confirm({
  bodyText,
  cancelText,
  confirmText,
  titleText
}: {
  bodyText: string;
  cancelText: string;
  confirmText: string;
  titleText: string;
}): Promise<boolean> {
  return new Promise((resolve) => {
    const root = createRoot(document.createElement("div"));
    root.render(
      createPortal(
        <Modal className="w-[550px]" fixed blur>
          <ModalHeader title={titleText} />
          <p className="px-4 pt-2 text-sm whitespace-pre">{bodyText}</p>
          <div className="my-6 flex justify-center gap-2 px-4">
            <ModalButton
              onClick={() => {
                root.unmount();
                resolve(false);
              }}
              variant="secondary"
              children={cancelText}
            />
            <ModalButton
              onClick={() => {
                root.unmount();
                resolve(true);
              }}
              variant="primary"
              children={confirmText}
            />
          </div>
        </Modal>,
        document.body
      )
    );
  });
}
