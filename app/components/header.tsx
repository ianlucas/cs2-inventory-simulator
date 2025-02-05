/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faSteam } from "@fortawesome/free-brands-svg-icons";
import {
  faBarsStaggered,
  faBoxesStacked,
  faCog,
  faHammer,
  faRightFromBracket,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useToggle } from "@uidotdev/usehooks";
import clsx from "clsx";
import { useCraftFilterRules } from "~/components/hooks/use-craft-filter-rules";
import { useIsDesktop } from "~/components/hooks/use-is-desktop";
import { useIsOnTop } from "~/components/hooks/use-is-on-top";
import { ECONOMY_ITEM_FILTERS } from "~/utils/economy-filters";
import {
  useInventory,
  useLocalize,
  usePreferences,
  useUser
} from "./app-context";
import { DonateHeaderLink } from "./donate-header-link";
import { HeaderLink } from "./header-link";
import { InventoryFilter } from "./inventory-filter";
import { useItemSelector } from "./item-selector-context";
import { Logo } from "./logo";

export function Header() {
  const user = useUser();
  const [inventory] = useInventory();
  const { hideFilters } = usePreferences();
  const localize = useLocalize();
  const [itemSelector] = useItemSelector();
  const craftFilter = useCraftFilterRules();
  const [isMenuOpen, toggleIsMenuOpen] = useToggle(false);
  const isDesktop = useIsDesktop();
  const isOnTop = useIsOnTop();

  function closeMenu() {
    toggleIsMenuOpen(false);
  }

  const isInventoryFull = inventory.isFull();
  const cannotCraftItems =
    ECONOMY_ITEM_FILTERS.filter(craftFilter).length === 0;
  const isCraftDisabled = isInventoryFull || cannotCraftItems;

  const isSelectingAnItem = itemSelector !== undefined;

  return (
    <div
      className={clsx(
        "font-display sticky top-0 left-0 z-20 w-full backdrop-blur-sm transition-all before:absolute before:inset-0 before:-z-10 before:bg-linear-to-b before:from-neutral-800/60 before:to-transparent before:transition-all before:content-['']",
        isOnTop ? "before:opacity-0" : "before:opacity-1"
      )}
    >
      <div className="m-auto px-4 py-4 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] lg:flex lg:w-[1024px] lg:items-center lg:gap-8 lg:px-0">
        <div className="flex items-center justify-between">
          <Logo className="h-8" />
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
            <nav className="rounded-sm bg-stone-800 p-2 text-sm lg:flex lg:items-center lg:gap-4 lg:bg-transparent lg:p-0">
              <HeaderLink
                to="/"
                icon={faBoxesStacked}
                label={localize("HeaderInventoryLabel")}
                onClick={closeMenu}
              />
              <HeaderLink
                disabled={isCraftDisabled}
                disabledText={
                  isInventoryFull
                    ? localize("HeaderCraftInventoryFull")
                    : localize("HeaderCraftCannotCraft")
                }
                to="/craft"
                icon={faHammer}
                label={localize("HeaderCraftLabel")}
                onClick={closeMenu}
              />
              {user === undefined ? (
                <>
                  <HeaderLink
                    to="/sign-in"
                    icon={faSteam}
                    label={localize("HeaderSignInLabel")}
                  />
                  <div className="gap-4 lg:flex lg:flex-1 lg:justify-end">
                    <DonateHeaderLink />
                    <HeaderLink
                      to="/settings"
                      icon={faCog}
                      onClick={closeMenu}
                      label={localize("HeaderSettingsLabel")}
                    />
                  </div>
                </>
              ) : (
                <>
                  <HeaderLink
                    icon={faRightFromBracket}
                    label={localize("HeaderSignOutLabel")}
                    onClick={closeMenu}
                    to="/sign-out"
                  />
                  <div className="gap-4 lg:flex lg:flex-1 lg:justify-end">
                    <DonateHeaderLink />
                    <HeaderLink to="/settings" onClick={closeMenu}>
                      <span className="text-neutral-400">
                        {localize("HeaderSignedInAsLabel")}
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
      {!hideFilters && !isSelectingAnItem && <InventoryFilter />}
    </div>
  );
}
