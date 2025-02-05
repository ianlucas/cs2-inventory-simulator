/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ClientOnly } from "remix-utils/client-only";
import { DEFAULT_APP_FOOTER_NAME } from "~/app-defaults";
import { isOurHostname } from "~/utils/misc";
import { useRules } from "./app-context";

export function Footer() {
  const { buildLastCommit, appFooterName } = useRules();

  return (
    <footer className="my-8 text-sm text-neutral-400 drop-shadow-xs select-none">
      <div className="text-center text-sm">
        <span>
          &copy; {new Date().getFullYear()}{" "}
          {appFooterName || DEFAULT_APP_FOOTER_NAME}
        </span>
      </div>
      <ClientOnly
        children={() =>
          isOurHostname() ? (
            <div className="flex items-center justify-center gap-2 text-xs">
              {buildLastCommit !== undefined && (
                <>
                  <a
                    className="transition-all hover:text-blue-500"
                    href={`https://github.com/ianlucas/cs2-inventory-simulator/commit/${buildLastCommit}`}
                    target="_blank"
                  >
                    Ver. {buildLastCommit?.substring(0, 7)}
                  </a>
                  &middot;
                </>
              )}
              <p>
                Found an issue?{" "}
                <a
                  href="https://github.com/ianlucas/cs2-inventory-simulator/issues"
                  className="underline hover:text-blue-500"
                  target="_blank"
                >
                  Report it here
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="text-center text-[10px]">
              powered by{" "}
              <a
                href="https://github.com/ianlucas/cs2-inventory-simulator"
                className="underline hover:text-blue-500"
                target="_blank"
              >
                Inventory Simulator
              </a>
            </div>
          )
        }
      />
    </footer>
  );
}
