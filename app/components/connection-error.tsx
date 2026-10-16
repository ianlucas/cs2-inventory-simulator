/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MouseEvent } from "react";
import { errorBoundaryEnglish } from "~/data/error-boundary-english";

export function ConnectionError({
  translate
}: {
  translate: (token: keyof typeof errorBoundaryEnglish) => string;
}) {
  function handleRetry(event: MouseEvent) {
    event.preventDefault();
    window.location.reload();
  }

  return (
    <>
      <h1 className="mt-4 text-lg font-bold">
        {translate("ErrorBoundaryConnectionTitle")}
      </h1>
      <p>{translate("ErrorBoundaryConnectionDesc")}</p>
      <p className="mt-4">
        <a className="underline" href="#" onClick={handleRetry}>
          {translate("ErrorBoundaryConnectionRetry")}
        </a>
      </p>
    </>
  );
}
