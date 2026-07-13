/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faMagnifyingGlass, faTag } from "@fortawesome/free-solid-svg-icons";
import { CS2Economy, CS2EconomyItem } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { useInput } from "~/components/hooks/use-input";
import { sortByName } from "~/utils/economy";
import { useTranslate } from "./app-context";
import { IconInput } from "./icon-input";
import { IconSelect } from "./icon-select";
import { ItemBrowser } from "./item-browser";
import { Modal, ModalHeader, ModalNav } from "./modal";

export function SelectStickerModal({
  fixed,
  hidden,
  onClose,
  onSelect,
  stickerFilter
}: {
  fixed?: boolean;
  hidden?: boolean;
  onClose: () => void;
  onSelect: (item: CS2EconomyItem) => void;
  stickerFilter?: (item: CS2EconomyItem) => boolean;
}) {
  const translate = useTranslate();
  const [category, setCategory] = useState("");
  const [search, setSearch] = useInput("");
  const stickers = useMemo(() => CS2Economy.getStickers().sort(sortByName), []);
  const categories = useMemo(() => CS2Economy.getStickerCategories(), []);

  const filtered = useMemo(() => {
    const words = search.split(" ").map((word) => word.toLowerCase());
    return stickers.filter((item) => {
      if (stickerFilter !== undefined && !stickerFilter(item)) {
        return false;
      }
      if (category !== "" && item.category !== category) {
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
  }, [search, category, stickers, stickerFilter]);

  return (
    <Modal className="w-135 pb-1" fixed={fixed} hidden={hidden} blur>
      <ModalHeader title={translate("StickerPickerHeader")} onClose={onClose} />
      <ModalNav
        items={[]}
        right={
          <div className="flex items-center gap-2">
            <IconSelect
              icon={faTag}
              className={clsx(
                "h-4 w-42 shrink-0 outline-hidden",
                category === "" && "text-neutral-600"
              )}
              onChange={setCategory}
              options={categories}
              placeholder={translate("StickerPickerFilterPlaceholder")}
              styleless
              value={category}
            />
            <IconInput
              autoFocus
              icon={faMagnifyingGlass}
              labelStyles="w-44 shrink-0"
              onChange={setSearch}
              placeholder={translate("StickerPickerSearchPlaceholder")}
              value={search}
            />
          </div>
        }
      />
      <ItemBrowser items={filtered} onClick={onSelect} />
    </Modal>
  );
}
