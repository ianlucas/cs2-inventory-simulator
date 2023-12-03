/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useRootContext } from "~/components/root-context";
import { ActionShape } from "~/routes/api.action.sync._index";
import { sync } from "~/utils/sync";

export function useSync() {
  const { user } = useRootContext();
  return async function useSync(data: ActionShape) {
    if (user !== undefined) {
      await sync(data);
    }
  };
}
