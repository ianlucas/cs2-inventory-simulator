/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  faMagnifyingGlass,
  faTag,
  faTrashCan,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2EconomyItem,
  CS2_MAX_STICKER_WEAR,
  CS2_MIN_STICKER_WEAR,
  CS2_STICKER_WEAR_FACTOR
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { stickerWearStringMaxLen, stickerWearToString } from "~/utils/economy";
import { useLocalize } from "./app-context";
import { EditorInput } from "./editor-input";
import { EditorSelect } from "./editor-select";
import { EditorStepRangeWithInput } from "./editor-step-range-with-input";
import { ItemBrowser } from "./item-browser";
import { ItemEditorLabel } from "./item-editor-label";
import { Modal } from "./modal";

export function StickerPickerSelect({
  categories,
  category,
  filtered,
  hidden,
  onAddSticker,
  onClose,
  onRemoveSticker,
  search,
  setCategory,
  setSearch,
  setWear,
  wear
}: {
  categories: string[];
  category: string;
  filtered: CS2EconomyItem[];
  hidden: boolean;
  onAddSticker: (item: CS2EconomyItem) => void;
  onClose: () => void;
  onRemoveSticker: () => void;
  search: string;
  setCategory: (category: string) => void;
  setSearch: (event: string | React.ChangeEvent<HTMLInputElement>) => void;
  setWear: (wear: number) => void;
  wear: number;
}) {
  const localize = useLocalize();
  return (
    <Modal className="w-[540px] pb-1" hidden={hidden} blur>
      <div className="flex select-none justify-between px-4 py-2 font-bold">
        <label className="text-sm text-neutral-400">
          {localize("StickerPickerHeader")}
        </label>
        <button
          onClick={onClose}
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
            placeholder={localize("StickerPickerSearchPlaceholder")}
          />
        </div>
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faTag} className="h-4" />
          <EditorSelect
            className="w-[192px]"
            onChange={setCategory}
            options={categories}
            placeholder={localize("StickerPickerFilterPlaceholder")}
            value={category}
          />
        </div>
        <button
          className="flex h-[24px] cursor-default items-center gap-1 rounded px-2 text-red-500 transition hover:bg-black/30 active:bg-black/60"
          onClick={onRemoveSticker}
          title={localize("StickerPickerRemove")}
        >
          <FontAwesomeIcon icon={faTrashCan} className="h-4" />
        </button>
      </div>
      <div
        className={clsx(
          "m-auto w-[460px] select-none px-4 pb-4 lg:px-0",
          filtered.length === 0 && "invisible"
        )}
      >
        <ItemEditorLabel
          className="flex select-none items-center gap-4"
          label={localize("EditorStickerWear")}
          labelStyles="w-[136px]"
        >
          <EditorStepRangeWithInput
            inputStyles="w-[26px]"
            max={CS2_MAX_STICKER_WEAR}
            maxLength={stickerWearStringMaxLen}
            min={CS2_MIN_STICKER_WEAR}
            onChange={setWear}
            randomizable
            step={CS2_STICKER_WEAR_FACTOR}
            stepRangeStyles="flex-1"
            transform={stickerWearToString}
            type="float"
            validate={(value) =>
              value >= CS2_MIN_STICKER_WEAR && value <= CS2_MAX_STICKER_WEAR
            }
            value={wear}
          />
        </ItemEditorLabel>
      </div>
      <ItemBrowser items={filtered} onClick={onAddSticker} />
    </Modal>
  );
}
