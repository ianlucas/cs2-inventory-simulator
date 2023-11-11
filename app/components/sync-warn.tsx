/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "~/hooks/use-translation";
import { retrieveUserId } from "~/utils/user";
import { useRootContext } from "./root-context";

export function SyncWarn() {
  const { user } = useRootContext();
  const translate = useTranslation();

  return user === undefined && typeof retrieveUserId() === "string"
    ? (
      <div className="text-sm lg:text-base flex items-center gap-4 lg:gap-2 justify-center text-white bg-red-500/40 py-2 select-none px-4 lg:px-0">
        <FontAwesomeIcon icon={faExclamationTriangle} className="h-4" />
        {translate("SyncWarnText")}
      </div>
    )
    : null;
}
