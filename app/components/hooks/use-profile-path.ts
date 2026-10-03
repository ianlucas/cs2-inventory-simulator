/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useRules, useUser } from "~/components/app-context";

export function useProfilePath() {
  const user = useUser();
  const { inventoryAllowProfile } = useRules();
  return user !== undefined && inventoryAllowProfile
    ? `/profiles/${user.id}`
    : undefined;
}
