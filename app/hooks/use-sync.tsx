/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useRootContext } from "~/components/root-context";
import { sync } from "~/utils/sync";

export function useSync() {
  const { user } = useRootContext();
  /** @TODO add type-safety to `data` paramater. */
  return async function useSync(type: string, data: any) {
    if (user !== undefined) {
      await sync(type, data);
    }
  };
}
