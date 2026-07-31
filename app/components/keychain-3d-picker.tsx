/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  faArrowRotateLeft,
  faShuffle,
  faTrashCan
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2_INVENTORY_RULES,
  CS2_KEYCHAIN_POSITION_FACTOR,
  CS2_MAX_KEYCHAIN_SEED,
  CS2_MAX_KEYCHAINS,
  CS2_MIN_KEYCHAIN_SEED,
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2InventoryItem
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import {
  keychainPositionStringMaxLen,
  keychainPositionToString,
  keychainSeedStringMaxLen,
  validateKeychainSeed
} from "~/utils/economy";
import { range } from "~/utils/number";
import { useTranslate } from "./app-context";
import {
  AttachmentEditorDrawer,
  AttachmentSlotsDrawer,
  FORM_ECHO_WINDOW_MS,
  attachmentName
} from "./attachment-3d-drawer";
import { ButtonWithTooltip } from "./button-with-tooltip";
import { EditorLabel } from "./editor-label";
import { EditorStepRangeWithInput } from "./editor-step-range-with-input";
import { useNameItemString } from "./hooks/use-name-item";
import { useViewer } from "./hooks/use-viewer";
import { useViewerStatus } from "./hooks/use-viewer-status";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { Presence } from "./presence";
import { SelectKeychainModal } from "./select-keychain-modal";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";
import { ViewerOverlay } from "./viewer-overlay";

type Keychains = NonNullable<CS2BaseInventoryItem["keychains"]>;
type Keychain = Keychains[string];

// A weapon carries one charm, so only the lowest-keyed entry applies (the same
// rule the viewer follows for the `keychains` Record).
function toKeychain(keychains: Keychains): Keychain | undefined {
  const keys = Object.keys(keychains);
  if (keys.length === 0) {
    return undefined;
  }
  const lowest = keys.reduce((a, b) => (Number(b) < Number(a) ? b : a));
  return keychains[lowest];
}

// Absent axes are meaningful (the model's default location), so compare them
// raw — an explicit 0 is a real position, not a default.
function keychainsEqual(
  a: Keychain | undefined,
  b: Keychain | undefined
): boolean {
  if (a === undefined || b === undefined) {
    return a === b;
  }
  return (
    a.id === b.id &&
    (a.seed ?? CS2_MIN_KEYCHAIN_SEED) === (b.seed ?? CS2_MIN_KEYCHAIN_SEED) &&
    a.x === b.x &&
    a.y === b.y &&
    a.z === b.z
  );
}

function Keychain3dEditorOverlay({
  forItem,
  keychainFilter,
  nameTag,
  onChange,
  onClose,
  seed,
  statTrak,
  stickers,
  value,
  wear
}: {
  forItem: CS2EconomyItem | CS2InventoryItem;
  keychainFilter?: (item: CS2EconomyItem) => boolean;
  nameTag?: string;
  onChange: (value: Keychains) => void;
  onClose: () => void;
  seed?: number;
  statTrak?: number;
  stickers?: CS2BaseInventoryItem["stickers"];
  value: Keychains;
  wear?: number;
}) {
  const translate = useTranslate();
  const nameItemString = useNameItemString();

  const [keychain, setKeychain] = useState<Keychain | undefined>(() =>
    toKeychain(value)
  );
  const [initialItem] = useState<CS2BaseInventoryItem>(() => {
    const initial = toKeychain(value);
    return {
      id: forItem.id,
      seed,
      wear,
      statTrak,
      nameTag,
      stickers,
      keychains: initial !== undefined ? { 0: initial } : undefined
    };
  });
  const { api, viewerProps } = useViewer({ item: initialItem });

  const [selected, setSelected] = useState(false);
  const [selecting, setSelecting] = useState(false);

  const keychainRef = useRef(keychain);
  const lastEditAtRef = useRef(0);
  const onCloseRef = useRef(onClose);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onCloseRef.current = onClose;
    onChangeRef.current = onChange;
  }, [onChange, onClose]);

  const viewerStatus = useViewerStatus(api);

  useEffect(() => {
    if (viewerStatus !== "unavailable") {
      return;
    }
    onChangeRef.current(toStored(keychainRef.current));
    onCloseRef.current();
  }, [viewerStatus]);

  useEffect(() => {
    if (api === undefined) {
      return;
    }
    const offChange = api.on("change", ({ item }) => {
      if (Date.now() - lastEditAtRef.current < FORM_ECHO_WINDOW_MS) {
        return;
      }
      const incoming = toKeychain(item.keychains ?? {});
      if (keychainsEqual(keychainRef.current, incoming)) {
        return;
      }
      keychainRef.current = incoming;
      setKeychain(incoming);
    });
    return () => offChange();
  }, [api]);

  const keychainPositionBounds = forItem.getKeychainPositionBounds();

  function toStored(current: Keychain | undefined): Keychains {
    if (current === undefined) {
      return {};
    }
    const { id, seed: keychainSeed, x, y, z } = current;
    return {
      0: {
        id,
        seed:
          keychainSeed !== undefined && keychainSeed !== CS2_MIN_KEYCHAIN_SEED
            ? keychainSeed
            : undefined,
        x,
        y,
        z
      }
    };
  }

  function stageKeychain(next: Keychain | undefined) {
    keychainRef.current = next;
    setKeychain(next);
  }

  function buildItem(next: Keychain | undefined): CS2BaseInventoryItem {
    return {
      id: forItem.id,
      seed,
      wear,
      statTrak,
      nameTag,
      stickers,
      keychains: next !== undefined ? { 0: next } : undefined
    };
  }

  function handleApply() {
    onChangeRef.current(toStored(keychainRef.current));
    onCloseRef.current();
  }

  function handleSelect(item: CS2EconomyItem) {
    setSelecting(false);
    const current = keychainRef.current;
    // A swap keeps the seed and the position, matching the viewer's own
    // setKeychain semantics — a user auditioning charms doesn't re-place each.
    const next: Keychain =
      current !== undefined ? { ...current, id: item.id } : { id: item.id };
    stageKeychain(next);
    api?.setItem(buildItem(next));
    setSelected(true);
    api?.setSelection({ selection: { kind: "keychain", index: 0 } });
  }

  function handleRemove() {
    stageKeychain(undefined);
    api?.setItem(buildItem(undefined));
    setSelected(false);
  }

  function handleToggleSelect() {
    if (selected) {
      setSelected(false);
      api?.setSelection({ selection: null });
    } else {
      setSelected(true);
      api?.setSelection({ selection: { kind: "keychain", index: 0 } });
    }
  }

  function handleEdit(data: Partial<Keychain>) {
    const current = keychainRef.current;
    if (current === undefined) {
      return;
    }
    lastEditAtRef.current = Date.now();
    const next = { ...current, ...data };
    stageKeychain(next);
    api?.setItem(buildItem(next));
  }

  function handleRerollPosition() {
    // The re-rolled position comes back through `change` (no echo window set,
    // so it flows into the form).
    api?.rerollKeychainPosition({ index: 0 });
  }

  function handleResetPosition() {
    const current = keychainRef.current;
    if (current === undefined) {
      return;
    }
    // Dropping the axes (not zeroing them) puts the charm back at the model's
    // default location — 0,0,0 is a real point inside the weapon.
    const next: Keychain = { id: current.id, seed: current.seed };
    stageKeychain(next);
    api?.setItem(buildItem(next));
  }

  const item =
    keychain !== undefined ? CS2Economy.getById(keychain.id) : undefined;
  const hasPosition =
    keychain !== undefined &&
    (keychain.x !== undefined ||
      keychain.y !== undefined ||
      keychain.z !== undefined);

  const positionAxes = [
    {
      axis: "x" as const,
      label: translate("EditorKeychainX"),
      bounds: keychainPositionBounds?.x,
      rule: CS2_INVENTORY_RULES.keychainPositionX
    },
    {
      axis: "y" as const,
      label: translate("EditorKeychainY"),
      bounds: keychainPositionBounds?.y,
      rule: CS2_INVENTORY_RULES.keychainPositionY
    },
    {
      axis: "z" as const,
      label: translate("EditorKeychainZ"),
      bounds: keychainPositionBounds?.z,
      rule: CS2_INVENTORY_RULES.keychainPositionZ
    }
  ];

  return (
    <ViewerOverlay
      header={
        <UseItemHeader
          actionDesc={translate("ApplyStickerUseOn")}
          actionItem={nameItemString(forItem)}
          title={translate("ApplyKeychainUse")}
          warning={translate("ApplyKeychainWarn")}
        />
      }
      viewerProps={viewerProps}
    >
      <AttachmentSlotsDrawer
        label={translate("EditorKeychains")}
        listClassName="min-h-28 justify-center overflow-y-auto"
      >
        {keychain !== undefined && item !== undefined ? (
          <div
            className={clsx(
              "group pointer-events-auto overflow-hidden rounded-l transition duration-150",
              selected ? "bg-blue-600/40" : "hover:bg-neutral-700/80"
            )}
          >
            <div
              className="flex items-center gap-1 p-1 pr-2"
              onClick={handleToggleSelect}
            >
              <span className="w-5 shrink-0" />
              <button
                className="relative aspect-256/192 h-12 shrink-0 overflow-hidden bg-neutral-950/40"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelecting(true);
                }}
                title={translate("EditorKeychainEdit")}
              >
                <ItemImage item={item} />
                <div className="absolute top-0 left-0 size-full border-2 border-transparent group-hover:border-blue-500/50" />
              </button>
              <span className="flex-1 truncate px-1 text-sm text-neutral-200">
                {attachmentName(item.name)}
              </span>
              <ButtonWithTooltip
                className="shrink-0 rounded-sm p-2 text-neutral-300 transition hover:bg-red-500/40"
                onClick={(event) => {
                  event.stopPropagation();
                  handleRemove();
                }}
                tooltip={translate("KeychainPickerRemove")}
              >
                <FontAwesomeIcon icon={faTrashCan} className="h-3.5" />
              </ButtonWithTooltip>
            </div>
          </div>
        ) : (
          range(CS2_MAX_KEYCHAINS).map((index) => (
            <button
              key={`empty-${index}`}
              className="group pointer-events-auto flex items-center gap-1 rounded-l p-1 transition hover:bg-neutral-700/80"
              onClick={() => setSelecting(true)}
            >
              <span className="w-5 shrink-0" />
              <span className="flex aspect-256/192 h-12 shrink-0 items-center justify-center border-2 border-transparent bg-neutral-900 text-xs text-neutral-600 group-hover:border-blue-500/50">
                {translate("KeychainPickerNA")}
              </span>
            </button>
          ))
        )}
      </AttachmentSlotsDrawer>
      {selected && keychain !== undefined && item !== undefined && (
        <AttachmentEditorDrawer
          label={attachmentName(item.name)}
          panelClassName="min-h-48 justify-center"
        >
          <div className="space-y-1.5 overflow-y-auto p-2">
            <EditorLabel label={translate("EditorPattern")}>
              <EditorStepRangeWithInput
                inputStyles="w-24 min-w-0"
                max={CS2_MAX_KEYCHAIN_SEED}
                maxLength={keychainSeedStringMaxLen}
                min={CS2_MIN_KEYCHAIN_SEED}
                onChange={(seed) => handleEdit({ seed })}
                randomizable
                step={1}
                stepRangeStyles="flex-1"
                type="int"
                validate={validateKeychainSeed}
                value={keychain.seed ?? CS2_MIN_KEYCHAIN_SEED}
              />
            </EditorLabel>
            {positionAxes.map(({ axis, label, bounds, rule }) => {
              const axisValue = keychain[axis];
              if (
                axisValue === undefined ||
                bounds?.min === undefined ||
                bounds.max === undefined
              ) {
                return null;
              }
              return (
                <EditorLabel key={axis} label={label}>
                  <EditorStepRangeWithInput
                    inputStyles="w-24 min-w-0"
                    max={bounds.max}
                    maxLength={keychainPositionStringMaxLen(
                      bounds.min,
                      bounds.max
                    )}
                    min={bounds.min}
                    onChange={(value) => handleEdit({ [axis]: value })}
                    step={CS2_KEYCHAIN_POSITION_FACTOR}
                    stepRangeStyles="flex-1"
                    transform={keychainPositionToString}
                    type="float"
                    validate={(value) => rule.check(value, forItem)}
                    value={axisValue}
                  />
                </EditorLabel>
              );
            })}
            <div className="flex justify-end gap-1">
              <ButtonWithTooltip
                tooltip={translate("ApplyKeychainNextPosition")}
                className="bg-black/10 p-2 text-neutral-300 transition hover:bg-black/30"
                onClick={handleRerollPosition}
              >
                <FontAwesomeIcon icon={faShuffle} className="h-4" />
              </ButtonWithTooltip>
              {hasPosition && (
                <ButtonWithTooltip
                  tooltip={translate("ApplyKeychainResetPosition")}
                  className="bg-black/10 p-2 text-neutral-300 transition hover:bg-black/30"
                  onClick={handleResetPosition}
                >
                  <FontAwesomeIcon icon={faArrowRotateLeft} className="h-4" />
                </ButtonWithTooltip>
              )}
            </div>
          </div>
        </AttachmentEditorDrawer>
      )}
      <div className="pointer-events-none absolute bottom-8 left-0 w-full">
        <UseItemFooter
          className="w-200"
          right={
            <>
              <ModalButton
                variant="primary"
                onClick={handleApply}
                children={translate("ApplyKeychainUse")}
              />
              <ModalButton
                variant="secondary"
                onClick={() => onCloseRef.current()}
                children={translate("InspectClose")}
              />
            </>
          }
        />
      </div>
      <SelectKeychainModal
        hidden={!selecting}
        keychainFilter={keychainFilter}
        onClose={() => setSelecting(false)}
        onSelect={handleSelect}
      />
    </ViewerOverlay>
  );
}

export function Keychain3dPicker({
  disabled,
  forItem,
  keychainFilter,
  nameTag,
  onChange,
  seed,
  statTrak,
  stickers,
  value,
  wear
}: {
  disabled?: boolean;
  forItem: CS2EconomyItem | CS2InventoryItem;
  keychainFilter?: (item: CS2EconomyItem) => boolean;
  nameTag?: string;
  onChange: (value: Keychains) => void;
  seed?: number;
  statTrak?: number;
  stickers?: CS2BaseInventoryItem["stickers"];
  value: Keychains;
  wear?: number;
}) {
  const translate = useTranslate();
  const [isOpen, setIsOpen] = useState(false);

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
                className="absolute size-full cursor-default overflow-hidden bg-neutral-950/40"
                onClick={() => setIsOpen(true)}
              >
                {item !== undefined ? (
                  <ItemImage item={item} />
                ) : (
                  <div className="flex items-center justify-center text-neutral-700">
                    {translate("KeychainPickerNA")}
                  </div>
                )}
                {!disabled && (
                  <div className="absolute top-0 left-0 size-full border-2 border-transparent hover:border-blue-500/50" />
                )}
              </button>
            </div>
          );
        })}
      </div>
      <Presence present={isOpen}>
        {isOpen ? (
          <Keychain3dEditorOverlay
            forItem={forItem}
            keychainFilter={keychainFilter}
            nameTag={nameTag}
            onChange={onChange}
            onClose={() => setIsOpen(false)}
            seed={seed}
            statTrak={statTrak}
            stickers={stickers}
            value={value}
            wear={wear}
          />
        ) : null}
      </Presence>
    </>
  );
}
