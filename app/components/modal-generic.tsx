/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { useKeyRelease } from "./hooks/use-key-release";
import { Modal, ModalHeader } from "./modal";
import { ModalButton } from "./modal-button";
import { ToolInput } from "./tool-input";

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
      <Modal className="w-137.5">
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
        <Modal className="w-137.5" blur>
          <ModalHeader title={titleText} />
          <p className="px-4 pt-2 font-sans text-sm whitespace-pre-line">
            {bodyText}
          </p>
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

function PromptModal({
  cancelText,
  confirmText,
  defaultValue,
  maxLength,
  onClose,
  placeholder,
  titleText
}: {
  cancelText: string;
  confirmText: string;
  defaultValue?: string;
  maxLength?: number;
  onClose: (value?: string) => void;
  placeholder?: string;
  titleText: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const trimmed = value.trim();

  useKeyRelease("Escape", () => onClose());

  return (
    <Modal className="w-137.5" blur>
      <ModalHeader title={titleText} />
      <form
        className="px-4 pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (trimmed.length > 0) {
            onClose(trimmed);
          }
        }}
      >
        <div className="flex">
          <ToolInput
            data-autofocus
            maxLength={maxLength}
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
            value={value}
          />
        </div>
        <div className="my-6 flex justify-center gap-2">
          <ModalButton
            onClick={() => onClose()}
            type="button"
            variant="secondary"
            children={cancelText}
          />
          <ModalButton
            disabled={trimmed.length === 0}
            type="submit"
            variant="primary"
            children={confirmText}
          />
        </div>
      </form>
    </Modal>
  );
}

export async function prompt(
  props: Omit<Parameters<typeof PromptModal>[0], "onClose">
): Promise<string | undefined> {
  return new Promise((resolve) => {
    const root = createRoot(document.createElement("div"));
    root.render(
      createPortal(
        <PromptModal
          {...props}
          onClose={(value) => {
            root.unmount();
            resolve(value);
          }}
        />,
        document.body
      )
    );
  });
}
