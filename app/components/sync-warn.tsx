/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { retrieveUserId } from "~/utils/user";
import { useRootContext } from "./root-context";

export function SyncWarn() {
  const { user } = useRootContext();

  return user === undefined && typeof retrieveUserId() === "string"
    ? (
      <div className="flex items-center gap-2 justify-center text-white bg-red-500/40 py-2 select-none">
        <FontAwesomeIcon icon={faExclamationTriangle} className="h-4" />
        You are not authenticated, your changes will not by synchronized.
      </div>
    )
    : null;
}
