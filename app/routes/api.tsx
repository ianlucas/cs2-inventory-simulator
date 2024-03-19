/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { json } from "@remix-run/node";

export function loader() {
  return json(
    {
      message:
        "Resource not found, please refer to https://github.com/ianlucas/cs2-inventory-simulator/blob/main/docs/api.md."
    },
    {
      status: 404
    }
  );
}
