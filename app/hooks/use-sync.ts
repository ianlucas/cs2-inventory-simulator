/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useAppContext } from "~/components/app-context";
import { ActionShape } from "~/routes/api.action.sync._index";
import { pushToSync } from "~/sync";

export function useSync() {
  const { user } = useAppContext();
  return async function useSync(data: ActionShape) {
    if (user !== undefined) {
      pushToSync(data);
    }
  };
}
