/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function Footer() {
  return (
    <div className="my-8 flex select-none items-center justify-center gap-2 text-sm text-neutral-400 drop-shadow-sm">
      <span>&copy; 2023, CS2 Inventory Simulator.</span>
      <a
        href="https://github.com/ianlucas/cs2-inventory-simulator"
        className="flex items-center gap-1 transition-all hover:text-blue-500"
        target="_blank"
      >
        <FontAwesomeIcon icon={faGithub} className="h-4" />
        Source Code
      </a>
    </div>
  );
}
