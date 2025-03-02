/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  faMagnifyingGlass,
  faTrashCan
} from "@fortawesome/free-solid-svg-icons";
import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2ItemType,
  CS2_MAX_PATCHES,
  ensure
} from "@ianlucas/cs2-lib";
import { useMemo, useState } from "react";
import { useInput } from "~/components/hooks/use-input";
import { sortByName } from "~/utils/economy";
import { range } from "~/utils/number";
import { useTranslate } from "./app-context";
import { IconButton } from "./icon-button";
import { IconInput } from "./icon-input";
import { ItemBrowser } from "./item-browser";
import { ItemImage } from "./item-image";
import { Modal, ModalHeader } from "./modal";

export function PatchPicker({
  disabled,
  onChange,
  patchFilter,
  value
}: {
  disabled?: boolean;
  onChange: (value: NonNullable<CS2BaseInventoryItem["patches"]>) => void;
  patchFilter?: (item: CS2EconomyItem) => boolean;
  value: NonNullable<CS2BaseInventoryItem["patches"]>;
}) {
  const translate = useTranslate();

  const [search, setSearch] = useInput("");
  const [activeIndex, setActiveIndex] = useState<number>();
  const patches = useMemo(
    () => CS2Economy.filterItems({ type: CS2ItemType.Patch }).sort(sortByName),
    []
  );

  function handleClickSlot(index: number) {
    return function handleClickSlot() {
      setActiveIndex(index);
    };
  }

  function handleAddPatch(item: CS2EconomyItem) {
    onChange({
      ...value,
      [ensure(activeIndex)]: item.id
    });
    setActiveIndex(undefined);
  }

  function handleRemovePatch() {
    const newValue = { ...value };
    delete newValue[ensure(activeIndex)];
    onChange(newValue);
    setActiveIndex(undefined);
  }

  function handleCloseModal() {
    setActiveIndex(undefined);
  }

  const filtered = useMemo(() => {
    const words = search.split(" ").map((word) => word.toLowerCase());
    return patches.filter((item) => {
      if (patchFilter !== undefined && !patchFilter(item)) {
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
  }, [search]);

  return (
    <>
      <div className="grid grid-cols-5 gap-1">
        {range(CS2_MAX_PATCHES).map((index) => {
          const patchId = value[index];
          const item =
            patchId !== undefined ? CS2Economy.getById(patchId) : undefined;
          return (
            <button
              disabled={disabled}
              key={index}
              className="relative aspect-256/192 cursor-default overflow-hidden bg-neutral-950/40"
              onClick={handleClickSlot(index)}
            >
              {item !== undefined ? (
                <ItemImage className="aspect-256/192" item={item} />
              ) : (
                <div className="flex aspect-256/192 items-center justify-center text-neutral-700">
                  {translate("StickerPickerNA")}
                </div>
              )}
              {!disabled && (
                <div className="absolute top-0 left-0 h-full w-full border-2 border-transparent hover:border-blue-500/50" />
              )}
            </button>
          );
        })}
      </div>
      <Modal className="w-[540px] pb-1" hidden={activeIndex === undefined} blur>
        <ModalHeader
          title={translate("PatchPickerHeader")}
          onClose={handleCloseModal}
        />
        <div className="my-2 flex flex-col gap-2 px-2 lg:flex-row lg:items-center">
          <IconInput
            icon={faMagnifyingGlass}
            labelStyles="flex-1"
            onChange={setSearch}
            placeholder={translate("PatchPickerSearchPlaceholder")}
            value={search}
          />
          <IconButton
            icon={faTrashCan}
            onClick={handleRemovePatch}
            title={translate("StickerPickerRemove")}
          />
        </div>
        <ItemBrowser items={filtered} onClick={handleAddPatch} />
      </Modal>
    </>
  );
}
