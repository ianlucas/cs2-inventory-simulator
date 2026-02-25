/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslate } from "./app-context";
import { Modal, ModalHeader } from "./modal";
import { ModalButton } from "./modal-button";

export function ErrorAlert() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState<{ title: string; body: string }>();
  const translate = useTranslate();

  function handleClose() {
    setError(undefined);
  }

  useEffect(() => {
    const errorKey = searchParams.get("error") as
      | "FailedToAuth"
      | "FailedToValidate";
    if (errorKey !== null) {
      searchParams.delete("error");
      setError({
        title: translate(`ErrorAlert${errorKey}Title`),
        body: translate(`ErrorAlert${errorKey}`)
      });
      setSearchParams(new URLSearchParams(searchParams));
    }
  }, [searchParams]);

  if (error === undefined) {
    return null;
  }

  return (
    <Modal className="w-137.5" fixed>
      <ModalHeader title={error.title} />
      <p className="mt-2 px-4 text-sm">{error.body}</p>
      <div className="my-6 flex justify-center px-4">
        <ModalButton onClick={handleClose} variant="secondary" children="OK" />
      </div>
    </Modal>
  );
}
