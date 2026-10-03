/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useProfilePath } from "./hooks/use-profile-path";
import { InventoryShareButton } from "./inventory-share-button";

export function InventoryShare() {
  const profilePath = useProfilePath();

  if (profilePath === undefined) {
    return null;
  }

  return (
    <div className="hidden lg:block">
      <div className="m-auto flex w-5xl items-center justify-end py-1.5">
        <InventoryShareButton path={profilePath} />
      </div>
    </div>
  );
}
