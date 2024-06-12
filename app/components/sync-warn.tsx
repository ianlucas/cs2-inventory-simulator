/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ClientOnly } from "remix-utils/client-only";
import { retrieveUserId } from "~/utils/user";
import { useLocalize, useUser } from "./app-context";

export function SyncWarn() {
  const user = useUser();
  const localize = useLocalize();

  return (
    <ClientOnly
      children={() =>
        user === undefined && typeof retrieveUserId() === "string" ? (
          <div className="flex select-none items-center justify-center gap-4 bg-red-500/50 px-4 py-2 text-sm text-white lg:gap-2 lg:px-0 lg:text-base">
            <FontAwesomeIcon icon={faExclamationTriangle} className="h-4" />
            {localize("SyncWarnText")}
          </div>
        ) : null
      }
    />
  );
}
