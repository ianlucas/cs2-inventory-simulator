/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  faMagnifyingGlass,
  faTrashCan,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
import { useLocalize, useRules } from "./app-context";
import { EditorInput } from "./editor-input";
import { ItemBrowser } from "./item-browser";
import { ItemImage } from "./item-image";
import { Modal } from "./modal";

export function PatchPicker({
  disabled,
  isCrafting,
  onChange,
  value
}: {
  disabled?: boolean;
  isCrafting: boolean;
  onChange: (value: NonNullable<CS2BaseInventoryItem["patches"]>) => void;
  value: NonNullable<CS2BaseInventoryItem["patches"]>;
}) {
  const { craftHideId, craftHideCategory, editHideId, editHideCategory } =
    useRules();
  const localize = useLocalize();

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
      if (isCrafting && craftHideId.includes(item.id)) {
        return false;
      }
      if (
        isCrafting &&
        item.category !== undefined &&
        craftHideCategory.includes(item.category)
      ) {
        return false;
      }
      if (!isCrafting && editHideId.includes(item.id)) {
        return false;
      }
      if (
        !isCrafting &&
        item.category !== undefined &&
        editHideCategory.includes(item.category)
      ) {
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
      <div className="flex justify-between">
        {range(CS2_MAX_PATCHES).map((index) => {
          const patchId = value[index];
          const item =
            patchId !== undefined ? CS2Economy.getById(patchId) : undefined;
          return (
            <button
              disabled={disabled}
              key={index}
              className="relative overflow-hidden rounded bg-black/50"
              onClick={handleClickSlot(index)}
            >
              {item !== undefined ? (
                <ItemImage className="h-[51px] w-[68px]" item={item} />
              ) : (
                <div className="flex h-[51px] w-[68px] items-center justify-center font-display font-bold text-neutral-700">
                  {localize("StickerPickerNA")}
                </div>
              )}
              {!disabled && (
                <div className="absolute left-0 top-0 h-full w-full rounded border-[2.5px] border-transparent transition-all hover:border-white" />
              )}
            </button>
          );
        })}
      </div>
      <Modal className="w-[540px] pb-1" hidden={activeIndex === undefined} blur>
        <div className="flex select-none justify-between px-4 py-2 font-bold">
          <label className="text-sm text-neutral-400">
            {localize("PatchPickerHeader")}
          </label>
          <button
            onClick={handleCloseModal}
            className="cursor-default text-white/50 hover:text-white"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4" />
          </button>
        </div>
        <div className="mb-4 flex flex-col gap-2 px-2 lg:flex-row lg:items-center lg:pl-4 lg:pr-2">
          <div className="flex flex-1 items-center gap-2">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="h-4" />
            <EditorInput
              value={search}
              onChange={setSearch}
              placeholder={localize("PatchPickerSearchPlaceholder")}
            />
          </div>
          <button
            className="flex h-[24px] cursor-default items-center gap-1 rounded px-2 text-red-500 transition hover:bg-black/30 active:bg-black/60"
            onClick={handleRemovePatch}
            title={localize("StickerPickerRemove")}
          >
            <FontAwesomeIcon icon={faTrashCan} className="h-4" />
          </button>
        </div>
        <ItemBrowser items={filtered} onClick={handleAddPatch} />
      </Modal>
    </>
  );
}
