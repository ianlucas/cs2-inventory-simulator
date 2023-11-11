/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faSteam } from "@fortawesome/free-brands-svg-icons";
import { faBarsStaggered, faBoxesStacked, faCode, faCog, faPlus, faRightFromBracket, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useToggle } from "@uidotdev/usehooks";
import clsx from "clsx";
import { useRef } from "react";
import { useIsDesktop } from "~/hooks/use-is-desktop";
import { useIsOnTop } from "~/hooks/use-is-on-top";
import { useTranslation } from "~/hooks/use-translation";
import { HeaderLink } from "./header-link";
import { useRootContext } from "./root-context";

export function Header() {
  const { user, inventory } = useRootContext();
  const [isMenuOpen, toggleIsMenuOpen] = useToggle(false);
  const isDesktop = useIsDesktop();
  const translate = useTranslation();
  const ref = useRef<HTMLDivElement>(null!);
  const isOnTop = useIsOnTop();

  function closeMenu() {
    toggleIsMenuOpen(false);
  }

  return (
    <div
      className={clsx(
        "w-full drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] sticky top-0 left-0 z-30 transition-all",
        !isOnTop && "bg-gradient-to-b from-black/60 to-transparent"
      )}
      ref={ref}
    >
      <div className="text-white lg:w-[1024px] m-auto py-4 px-4 lg:px-0 lg:flex lg:items-center lg:gap-8">
        <div className="flex items-center justify-between">
          <div className="select-none">
            <span className="text-sm text-neutral-300">{"cstrike / "}</span>
            <span className="font-bold italic">Inventory Simulator</span>
          </div>
          <button
            className="py-1 px-2 lg:hidden"
            onClick={() => toggleIsMenuOpen()}
          >
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
                label={translate("HeaderInventoryLabel")}
                onClick={closeMenu}
              />
              {!inventory.full() && (
                <HeaderLink
                  to="/craft"
                  icon={faPlus}
                  label={translate("HeaderCraftLabel")}
                  onClick={closeMenu}
                />
              )}
              <HeaderLink
                to="/api"
                icon={faCode}
                label={translate("HeaderAPILabel")}
                onClick={closeMenu}
              />
              <HeaderLink
                to="/settings"
                icon={faCog}
                onClick={closeMenu}
              />
              {user === undefined
                ? (
                  <HeaderLink
                    to="sign-in"
                    icon={faSteam}
                    label={translate("HeaderSignInLabel")}
                  />
                )
                : (
                  <>
                    <HeaderLink
                      to="sign-out"
                      icon={faRightFromBracket}
                      label={translate("HeaderSignOutLabel")}
                    />
                    <div className="flex items-center gap-2 select-none flex-1 overflow-hidden justify-end">
                      <span className="text-neutral-400">
                        {translate("HeaderSignedInAsLabel")}
                      </span>
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
