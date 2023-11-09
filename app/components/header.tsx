/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faSteam } from "@fortawesome/free-brands-svg-icons";
import { faBarsStaggered, faBoxesStacked, faCode, faPlus, faRightFromBracket, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useToggle } from "@uidotdev/usehooks";
import { useIsDesktop } from "~/hooks/use-is-desktop";
import { HeaderLink } from "./header-link";
import { useRootContext } from "./root-context";

export function Header() {
  const { user, inventory } = useRootContext();
  const [isMenuOpen, toggleIsMenuOpen] = useToggle(false);
  const isDesktop = useIsDesktop();

  function closeMenu() {
    toggleIsMenuOpen(false);
  }

  return (
    <div className="w-full drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] bg-gradient-to-b from-black/60 to-transparent sticky top-0 left-0 z-30">
      <div className="text-white lg:w-[1024px] m-auto py-4 px-4 lg:px-0 lg:flex lg:items-center lg:gap-8">
        <div className="flex items-center justify-between">
          <div className="select-none">
            <span className="text-sm text-neutral-300">{"cstrike / "}</span>
            <span className="font-bold italic">Inventory Simulator</span>
          </div>
          <button className="py-1 px-2" onClick={() => toggleIsMenuOpen()}>
            <FontAwesomeIcon
              icon={isMenuOpen ? faXmark : faBarsStaggered}
              className="h-4"
            />
          </button>
        </div>
        {(isDesktop || isMenuOpen) && (
          <div className="mt-2 flex-1 lg:mt-0 px-4 lg:p-0 w-full lg:w-auto absolute left-0 lg:static">
            <div className="rounded p-2 lg:p-0 bg-stone-800 lg:bg-transparent lg:flex lg:items-center lg:gap-4 text-sm">
              <HeaderLink
                to="/"
                icon={faBoxesStacked}
                label="Inventory"
                onClick={closeMenu}
              />
              {!inventory.full() && (
                <HeaderLink
                  to="/craft"
                  icon={faPlus}
                  label="Craft Item"
                  onClick={closeMenu}
                />
              )}
              <HeaderLink
                to="/api"
                icon={faCode}
                label="API"
                onClick={closeMenu}
              />
              {user === undefined
                ? (
                  <HeaderLink
                    to="sign-in"
                    icon={faSteam}
                    label="Sign-in to sync"
                  />
                )
                : (
                  <>
                    <HeaderLink
                      to="sign-out"
                      icon={faRightFromBracket}
                      label="Sign out"
                    />
                    <div className="flex items-center gap-2 select-none flex-1 overflow-hidden justify-end">
                      <span className="text-neutral-400">Signed in as</span>
                      <span className="max-w-[256px] whitespace-nowrap text-ellipsis overflow-hidden">
                        {user.name}
                      </span>
                      <img
                        className="h-6 w-6 rounded-full"
                        src={user.avatar}
                        draggable={false}
                        alt={user.name}
                      />
                    </div>
                  </>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
