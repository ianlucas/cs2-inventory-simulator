/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DEFAULT_APP_FOOTER_NAME } from "~/app-defaults";
import { useRules } from "./app-context";

export function Footer() {
  const { appFooterName } = useRules();
  const sourceCommit = __SOURCE_COMMIT__;

  return (
    <footer className="my-8 text-sm text-neutral-400 drop-shadow-xs select-none">
      <div className="text-center text-sm">
        <span>
          &copy; {new Date().getFullYear()}{" "}
          {appFooterName || DEFAULT_APP_FOOTER_NAME}
        </span>
      </div>
    </footer>
  );
}
