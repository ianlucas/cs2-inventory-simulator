/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import { ComponentProps } from "react";
import { useIsDesktop } from "~/components/hooks/use-is-desktop";
import { useTranslate } from "./app-context";
import { useItemPickerState } from "./hooks/use-item-picker-state";
import { IconInput } from "./icon-input";
import { ItemPickerDesktop } from "./item-picker-desktop";
import { ItemPickerMobile } from "./item-picker-mobile";
import { ModalNav } from "./modal";

export function ItemPicker({
  navItems,
  onPickItem
}: {
  navItems: ComponentProps<typeof ModalNav>["items"];
  onPickItem: (item: CS2EconomyItem) => void;
}) {
  const isDesktop = useIsDesktop();
  const translate = useTranslate();
  const state = useItemPickerState({ onPickItem });

  return (
    <>
      <ModalNav
        items={navItems}
        right={
          isDesktop ? (
            <IconInput
              icon={faMagnifyingGlass}
              labelStyles="w-64"
              onChange={state.setQuery}
              placeholder={translate("CraftSearchPlaceholder")}
              value={state.query}
            />
          ) : undefined
        }
      />
      {isDesktop ? (
        <ItemPickerDesktop {...state} />
      ) : (
        <ItemPickerMobile {...state} />
      )}
    </>
  );
}
