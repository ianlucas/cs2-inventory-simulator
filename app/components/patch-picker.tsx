/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2BaseInventoryItem,
  CS2EconomyItem,
  ensure
} from "@ianlucas/cs2-lib";
import { useState } from "react";
import { useTranslate } from "./app-context";
import { ButtonWithTooltip } from "./button-with-tooltip";
import { confirm } from "./modal-generic";
import { PatchSlotGrid } from "./patch-slot-grid";
import { SelectPatchModal } from "./select-patch-modal";

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
  const [activeIndex, setActiveIndex] = useState<number>();

  function handleAddPatch(item: CS2EconomyItem) {
    onChange({
      ...value,
      [ensure(activeIndex)]: item.id
    });
    setActiveIndex(undefined);
  }

  function handleRemovePatch(index: number) {
    return async function handleRemovePatch() {
      if (
        await confirm({
          titleText: translate("PatchPickerRemove"),
          bodyText: translate("PatchPickerRemoveConfirm"),
          cancelText: translate("GenericNo"),
          confirmText: translate("GenericYes")
        })
      ) {
        const updated = { ...value };
        delete updated[index];
        onChange(updated);
      }
    };
  }

  function handleCloseModal() {
    setActiveIndex(undefined);
  }

  return (
    <>
      <PatchSlotGrid
        disabled={disabled}
        onSlotClick={setActiveIndex}
        renderSlotOverlay={(index) => (
          <ButtonWithTooltip
            onClick={handleRemovePatch(index)}
            className="absolute bottom-1 left-1 hover:bg-red-500/50"
            tooltip={translate("PatchPickerRemove")}
          >
            <FontAwesomeIcon icon={faTrashCan} className="h-3" />
          </ButtonWithTooltip>
        )}
        value={value}
      />
      <SelectPatchModal
        hidden={activeIndex === undefined}
        onClose={handleCloseModal}
        onSelect={handleAddPatch}
        patchFilter={patchFilter}
      />
    </>
  );
}
