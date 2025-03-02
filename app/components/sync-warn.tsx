/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ClientOnly } from "remix-utils/client-only";
import { didUserAuthenticateInThisBrowser } from "~/utils/user-cached-data";
import { useTranslate, useUser } from "./app-context";

export function SyncWarn() {
  const user = useUser();
  const translate = useTranslate();

  return (
    <ClientOnly
      children={() =>
        user === undefined && didUserAuthenticateInThisBrowser() ? (
          <div className="flex items-center justify-center gap-4 bg-red-500/50 px-4 py-2 text-sm text-white select-none lg:gap-2 lg:px-0 lg:text-sm lg:font-bold">
            <FontAwesomeIcon icon={faExclamationTriangle} className="h-4" />
            {translate("SyncWarnText")}
          </div>
        ) : null
      }
    />
  );
}
