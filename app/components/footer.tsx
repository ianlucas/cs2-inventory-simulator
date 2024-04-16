/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAppContext } from "./app-context";

export function Footer() {
  const {
    rules: { buildLastCommit }
  } = useAppContext();

  return (
    <footer className="my-8 select-none text-sm text-neutral-400 drop-shadow-sm">
      <div className="text-center">
        <span>
          &copy; {new Date().getFullYear()} cstrike's Inventory Simulator
        </span>
      </div>
      <div className="flex items-center justify-center gap-2">
        <a
          href="https://github.com/ianlucas/cs2-inventory-simulator"
          className="flex items-center gap-1 transition-all hover:text-blue-500"
          target="_blank"
        >
          <FontAwesomeIcon icon={faGithub} className="h-4" />
          Source Code
        </a>
        {buildLastCommit !== undefined && (
          <>
            &middot;
            <a
              className="transition-all hover:text-blue-500"
              href={`https://github.com/ianlucas/cs2-inventory-simulator/commit/${buildLastCommit}`}
              target="_blank"
            >
              {buildLastCommit.substring(0, 7)}
            </a>
          </>
        )}
      </div>
    </footer>
  );
}
