/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function Footer() {
  return (
    <div className="flex justify-center items-center my-8 text-sm gap-2 text-neutral-400 drop-shadow-sm select-none">
      <span>&copy; 2023, CS2 Inventory Simulator.</span>
      <a
        href="https://github.com/ianlucas/cs2-inventory-simulator"
        className="flex items-center gap-1 hover:text-blue-500 transition-all"
        target="_blank"
      >
        <FontAwesomeIcon icon={faGithub} className="h-4" />
        Source Code
      </a>
    </div>
  );
}