/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { CS2Economy, CS2EconomyItem } from "@ianlucas/cs2-lib";
import { useMemo } from "react";
import { useInput } from "~/components/hooks/use-input";
import { sortByName } from "~/utils/economy";
import { useTranslate } from "./app-context";
import { IconInput } from "./icon-input";
import { ItemBrowser } from "./item-browser";
import { Modal, ModalHeader, ModalNav } from "./modal";

export function SelectKeychainModal({
  hidden,
  keychainFilter,
  onClose,
  onSelect
}: {
  hidden?: boolean;
  keychainFilter?: (item: CS2EconomyItem) => boolean;
  onClose: () => void;
  onSelect: (item: CS2EconomyItem) => void;
}) {
  const translate = useTranslate();
  const [search, setSearch] = useInput("");
  const keychains = useMemo(
    () =>
      Array.from(CS2Economy.items.values())
        .filter((item) => !item.isDefault && item.isKeychain())
        .sort(sortByName),
    []
  );

  const filtered = useMemo(() => {
    const words = search.split(" ").map((word) => word.toLowerCase());
    return keychains.filter((item) => {
      if (keychainFilter !== undefined && !keychainFilter(item)) {
        return false;
      }
      const name = item.name.toLowerCase();
      for (const word of words) {
        if (word.length > 0 && name.indexOf(word) === -1) {
          return false;
        }
      }
      return true;
    });
  }, [search, keychains, keychainFilter]);

  return (
    <Modal className="w-135 pb-1" hidden={hidden} blur>
      <ModalHeader
        title={translate("KeychainPickerHeader")}
        onClose={onClose}
      />
      <ModalNav
        items={[]}
        right={
          <IconInput
            autoFocus
            icon={faMagnifyingGlass}
            labelStyles="w-64"
            onChange={setSearch}
            placeholder={translate("KeychainPickerSearchPlaceholder")}
            value={search}
          />
        }
      />
      <ItemBrowser items={filtered} onClick={onSelect} />
    </Modal>
  );
}
