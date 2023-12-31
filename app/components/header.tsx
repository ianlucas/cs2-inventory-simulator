/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faSteam } from "@fortawesome/free-brands-svg-icons";
import {
  faBarsStaggered,
  faBoxesStacked,
  faCode,
  faCog,
  faPlus,
  faRightFromBracket,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
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
        "sticky left-0 top-0 z-30 w-full drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] transition-all before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-b before:from-black/60 before:to-transparent before:transition-all before:content-['']",
        isOnTop ? "before:opacity-0" : "before:opacity-1"
      )}
      ref={ref}
    >
      <div className="m-auto px-4 py-4 text-white lg:flex lg:w-[1024px] lg:items-center lg:gap-8 lg:px-0">
        <div className="flex items-center justify-between">
          <div className="select-none">
            <span className="text-sm text-neutral-300">{"cstrike / "}</span>
            <span className="font-bold italic">Inventory Simulator</span>
          </div>
          <button
            className="px-2 py-1 lg:hidden"
            onClick={() => toggleIsMenuOpen()}
          >
            <FontAwesomeIcon
              icon={isMenuOpen ? faXmark : faBarsStaggered}
              className="h-4"
            />
          </button>
        </div>
        {(isDesktop || isMenuOpen) && (
          <div className="absolute left-0 mt-2 w-full flex-1 px-4 lg:static lg:mt-0 lg:w-auto lg:p-0">
            <nav className="rounded bg-stone-800 p-2 text-sm lg:flex lg:items-center lg:gap-4 lg:bg-transparent lg:p-0">
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
              {user === undefined ? (
                <>
                  <HeaderLink
                    to="/sign-in"
                    icon={faSteam}
                    label={translate("HeaderSignInLabel")}
                  />
                  <div className="flex flex-1 justify-end">
                    <HeaderLink
                      to="/settings"
                      icon={faCog}
                      onClick={closeMenu}
                      label={translate("HeaderSettingsLabel")}
                    />
                  </div>
                </>
              ) : (
                <>
                  <HeaderLink
                    icon={faRightFromBracket}
                    label={translate("HeaderSignOutLabel")}
                    onClick={closeMenu}
                    to="/sign-out"
                  />
                  <div className="flex flex-1 justify-end">
                    <HeaderLink to="/settings" onClick={closeMenu}>
                      <span className="text-neutral-400">
                        {translate("HeaderSignedInAsLabel")}
                      </span>
                      <span className="max-w-[256px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {user.name}
                      </span>
                      <img
                        className="h-6 w-6 rounded-full"
                        src={user.avatar}
                        draggable={false}
                        alt={user.name}
                      />
                    </HeaderLink>
                  </div>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
