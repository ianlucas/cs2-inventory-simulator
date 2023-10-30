/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faSteam } from "@fortawesome/free-brands-svg-icons";
import { faCode, faPlus, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { HeaderLink } from "./header-link";
import { useRootContext } from "./root-context";

export function Header() {
  const { user, inventory } = useRootContext();

  return (
    <div className="w-full bg-gradient-to-b drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
      <div className="w-[1024px] m-auto text-white py-4 flex items-center gap-8">
        <div className="select-none">
          <span className="text-sm text-neutral-300">{"cstrike / "}</span>
          <span className="font-bold italic">Inventory Simulator</span>
        </div>
        <div className="flex items-center gap-4">
          {!inventory.full() && (
            <HeaderLink to="craft" icon={faPlus} label="Craft Item" />
          )}
          <HeaderLink to="api" icon={faCode} label="API" />
          {user === undefined
            ? <HeaderLink to="sign-in" icon={faSteam} label="Sign-in to sync" />
            : (
              <>
                <div className="flex items-center gap-2 select-none">
                  <span className="text-neutral-400">Signed in as</span>
                  <span>{user.name}</span>{" "}
                  <img
                    className="h-6 w-6 rounded-full"
                    src={user.avatar}
                    draggable={false}
                    alt={user.name}
                  />
                </div>
                <HeaderLink
                  to="sign-out"
                  icon={faRightFromBracket}
                  label="Sign out"
                />
              </>
            )}
        </div>
      </div>
    </div>
  );
}
