/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  faMagnifyingGlass,
  faPen,
  faTrashCan
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2_MAX_KEYCHAINS,
  CS2_MIN_KEYCHAIN_SEED,
  assert,
  ensure
} from "@ianlucas/cs2-lib";
import { useMemo, useState } from "react";
import { useInput } from "~/components/hooks/use-input";
import { sortByName } from "~/utils/economy";
import { range } from "~/utils/number";
import { useTranslate } from "./app-context";
import { AppliedKeychainEditor } from "./applied-keychain-editor";
import { ButtonWithTooltip } from "./button-with-tooltip";
import { IconButton } from "./icon-button";
import { IconInput } from "./icon-input";
import { ItemBrowser } from "./item-browser";
import { ItemImage } from "./item-image";
import { Modal, ModalHeader } from "./modal";
import { ModalButton } from "./modal-button";

export function KeychainPicker({
  disabled,
  isHideKeychainSeed,
  isHideKeychainX,
  isHideKeychainY,
  keychainFilter,
  onChange,
  value
}: {
  disabled?: boolean;
  isHideKeychainSeed?: boolean;
  isHideKeychainX?: boolean;
  isHideKeychainY?: boolean;
  keychainFilter?: (item: CS2EconomyItem) => boolean;
  onChange: (value: NonNullable<CS2BaseInventoryItem["keychains"]>) => void;
  value: NonNullable<CS2BaseInventoryItem["keychains"]>;
}) {
  const translate = useTranslate();

  const [search, setSearch] = useInput("");
  const [activeIndex, setActiveIndex] = useState<number>();
  const keychains = useMemo(
    () =>
      Array.from(CS2Economy.items.values())
        .filter((item) => item.isKeychain())
        .sort(sortByName),
    []
  );
  const [appliedKeychainData, setAppliedKeychainData] = useState({
    seed: CS2_MIN_KEYCHAIN_SEED,
    x: 0,
    y: 0
  });
  const [selected, setSelected] = useState<CS2EconomyItem>();
  const [isEditing, setIsEditing] = useState(false);
  const canEditKeychainAttributes =
    !isHideKeychainSeed || !isHideKeychainX || !isHideKeychainY;

  function handleClickSlot(index: number) {
    return function handleClickSlot() {
      setActiveIndex(index);
    };
  }

  function handleClickEditSlot(index: number) {
    return function handleClickSlot() {
      const { id, seed, x, y } = value[index];
      setAppliedKeychainData({
        seed: seed ?? CS2_MIN_KEYCHAIN_SEED,
        x: x ?? 0,
        y: y ?? 0
      });
      setActiveIndex(index);
      setSelected(CS2Economy.getById(id));
      setIsEditing(true);
    };
  }

  function handleSelectKeychain(item: CS2EconomyItem) {
    setSelected(item);
  }

  function handleCloseSelectModal() {
    if (isEditing) {
      setActiveIndex(undefined);
    }
    setSelected(undefined);
    setIsEditing(false);
  }

  function handleAddKeychain() {
    assert(selected);
    onChange({
      ...value,
      [ensure(activeIndex)]: {
        id: selected.id,
        seed:
          appliedKeychainData.seed !== CS2_MIN_KEYCHAIN_SEED
            ? appliedKeychainData.seed
            : undefined,
        x: appliedKeychainData.x || undefined,
        y: appliedKeychainData.y || undefined
      }
    });
    setSelected(undefined);
    setActiveIndex(undefined);
    setIsEditing(false);
  }

  function handleRemoveKeychain() {
    const updated = { ...value };
    delete updated[ensure(activeIndex)];
    onChange(updated);
    setActiveIndex(undefined);
    setIsEditing(false);
  }

  function handleCloseModal() {
    setActiveIndex(undefined);
    setIsEditing(false);
  }

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
  }, [search]);

  return (
    <>
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(5, minmax(0, 1fr))`
        }}
      >
        {range(CS2_MAX_KEYCHAINS).map((index) => {
          const keychain = value[index];
          const item =
            keychain !== undefined
              ? CS2Economy.getById(keychain.id)
              : undefined;
          return (
            <div className="relative aspect-256/192" key={index}>
              <button
                disabled={disabled}
                className="absolute h-full w-full cursor-default overflow-hidden bg-neutral-950/40"
                onClick={handleClickSlot(index)}
              >
                {item !== undefined ? (
                  <ItemImage item={item} />
                ) : (
                  <div className="flex items-center justify-center text-neutral-700">
                    {translate("KeychainPickerNA")}
                  </div>
                )}
                {!disabled && (
                  <div className="absolute top-0 left-0 h-full w-full border-2 border-transparent hover:border-blue-500/50" />
                )}
              </button>
              {item !== undefined && !disabled && (
                <ButtonWithTooltip
                  onClick={handleClickEditSlot(index)}
                  className="absolute bottom-1 left-1 hover:bg-blue-500/50"
                  tooltip={translate("EditorKeychainEdit")}
                >
                  <FontAwesomeIcon icon={faPen} className="h-3" />
                </ButtonWithTooltip>
              )}
            </div>
          );
        })}
      </div>
      <Modal
        className="w-135 pb-1"
        hidden={activeIndex === undefined || isEditing}
        blur
      >
        <ModalHeader
          title={translate("KeychainPickerHeader")}
          onClose={handleCloseModal}
        />
        <div className="my-2 flex flex-col gap-2 px-2 lg:flex-row lg:items-center">
          <IconInput
            icon={faMagnifyingGlass}
            labelStyles="flex-1"
            onChange={setSearch}
            placeholder={translate("KeychainPickerSearchPlaceholder")}
            value={search}
          />
          <IconButton
            icon={faTrashCan}
            onClick={handleRemoveKeychain}
            title={translate("KeychainPickerRemove")}
          />
        </div>
        <ItemBrowser items={filtered} onClick={handleSelectKeychain} />
      </Modal>
      {selected !== undefined && (
        <Modal className="w-105">
          <ModalHeader
            title={translate("EditorConfirmPick")}
            onClose={handleCloseSelectModal}
          />
          {canEditKeychainAttributes && (
            <AppliedKeychainEditor
              className="px-4"
              isHideKeychainSeed={isHideKeychainSeed}
              isHideKeychainX={isHideKeychainX}
              isHideKeychainY={isHideKeychainY}
              item={selected}
              onChange={setAppliedKeychainData}
              value={appliedKeychainData}
            />
          )}
          <div className="my-6 flex justify-center gap-2">
            <ModalButton
              children={translate("EditorCancel")}
              onClick={handleCloseSelectModal}
              variant="secondary"
            />
            <ModalButton
              children={translate("EditorPick")}
              onClick={handleAddKeychain}
              variant="primary"
            />
          </div>
        </Modal>
      )}
    </>
  );
}
