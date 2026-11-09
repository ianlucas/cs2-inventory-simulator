/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faArrowRotateLeft, faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2_MIN_SEED,
  CS2_MIN_WEAR,
  CS2_WEAR_FACTOR,
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2InventoryItem
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import {
  ReactNode,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { getSoundProps } from "~/interface-sounds";
import { VIEWER_INSPECT_KINDS } from "~/viewer";
import {
  isItemCountable,
  PetStageLabel,
  wearStringMaxLen,
  wearToString
} from "~/shared/economy";
import { hasKeys } from "~/shared/misc";
import {
  createSouvenirSelection,
  findSouvenirSelection,
  getNewestSouvenirSourceIndex,
  getSouvenirKeychains,
  getSouvenirStickers,
  isSouvenirSelectionComplete,
  SouvenirSelection
} from "~/shared/souvenir";
import { AnimatedHeight } from "./animated-height";
import { useTranslate } from "./app-context";
import { ButtonWithTooltip } from "./button-with-tooltip";
import { EditorInput } from "./editor-input";
import { EditorItemDisplay } from "./editor-item-display";
import { EditorLabel } from "./editor-label";
import { EditorSelect } from "./editor-select";
import { EditorStepRangeWithInput } from "./editor-step-range-with-input";
import { HighlightPicker } from "./highlight-picker";
import { useIsDesktop } from "./hooks/use-is-desktop";
import { useKeyValues } from "./hooks/use-key-values";
import { useViewerAvailability } from "./hooks/use-viewer-availability";
import { Keychain3dPicker } from "./keychain-3d-picker";
import { KeychainPicker } from "./keychain-picker";
import { FitMarquee } from "./marquee";
import { confirm } from "./modal-generic";
import { Patch3dPicker } from "./patch-3d-picker";
import { PatchPicker } from "./patch-picker";
import { getSouvenirSourceLabel, SouvenirPanel } from "./souvenir-panel";
import { Sticker3dPicker } from "./sticker-3d-picker";
import { StickerPicker } from "./sticker-picker";

export interface ItemEditorAttributes {
  highlight?: number;
  keychains?: CS2BaseInventoryItem["keychains"];
  nameTag?: string;
  patches?: CS2BaseInventoryItem["patches"];
  quantity: number;
  seed?: number;
  souvenir?: boolean;
  statTrak?: boolean;
  stickers?: CS2BaseInventoryItem["stickers"];
  style?: number;
  upgradeLevel?: number;
  wear?: number;
}

type ItemEditorType = "normal" | "statTrak" | "souvenir";

function ItemTypeSegments({
  onChange,
  options,
  value
}: {
  onChange: (type: ItemEditorType) => void;
  options: { label: string; value: ItemEditorType }[];
  value: ItemEditorType;
}) {
  return (
    <div
      className="flex h-7 min-w-0 flex-1 gap-0.5 bg-neutral-950/40 p-0.5"
      role="group"
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            aria-pressed={isSelected}
            className={clsx(
              "flex min-w-0 flex-1 cursor-default items-center justify-center px-2 outline-hidden transition focus-visible:ring-2 focus-visible:ring-blue-500/50",
              isSelected
                ? "bg-blue-500/50 text-white"
                : "text-neutral-400 hover:bg-black/30 hover:text-neutral-200"
            )}
            key={option.value}
            onClick={() => {
              if (!isSelected) {
                onChange(option.value);
              }
            }}
            type="button"
            {...getSoundProps({
              press: isSelected ? "none" : "checkbox_toggle"
            })}
          >
            <FitMarquee className="min-w-0">{option.label}</FitMarquee>
          </button>
        );
      })}
    </div>
  );
}

function EditorTextValue({
  children,
  value
}: {
  children?: ReactNode;
  value?: string;
}) {
  return (
    <div className="flex h-7 min-w-0 flex-1 items-center justify-end gap-2">
      {value !== undefined && (
        <FitMarquee className="min-w-0">{value}</FitMarquee>
      )}
      {children}
    </div>
  );
}

export function ItemEditor({
  className,
  defaultQuantity,
  isDisabled,
  isHideKeychainSeed,
  isHideKeychains,
  isHideKeychainX,
  isHideKeychainY,
  isHideKeychainZ,
  isHideNameTag,
  isHidePatches,
  isHideSeed,
  isHideSouvenir,
  isHideStatTrak,
  isHideStickerRotation,
  isHideStickerSchema,
  isHideStickers,
  isHideStickerWear,
  isHideStickerX,
  isHideStickerY,
  isHideStyle,
  isHideUpgradeLevel,
  isHideWear,
  item,
  keychainFilter,
  maxQuantity,
  onChange,
  patchFilter,
  stickerFilter
}: {
  className?: string;
  defaultQuantity?: number;
  item: CS2InventoryItem | CS2EconomyItem;
  maxQuantity?: number;
  isDisabled?: boolean;
  isHideKeychainSeed?: boolean;
  isHideKeychains?: boolean;
  isHideKeychainX?: boolean;
  isHideKeychainY?: boolean;
  isHideKeychainZ?: boolean;
  isHideNameTag?: boolean;
  isHidePatches?: boolean;
  isHideSeed?: boolean;
  isHideSouvenir?: boolean;
  isHideStatTrak?: boolean;
  isHideStickerRotation?: boolean;
  isHideStickerSchema?: boolean;
  isHideStickers?: boolean;
  isHideStickerWear?: boolean;
  isHideStickerX?: boolean;
  isHideStickerY?: boolean;
  isHideStyle?: boolean;
  isHideUpgradeLevel?: boolean;
  isHideWear?: boolean;
  keychainFilter?: (item: CS2EconomyItem) => boolean;
  // Receives `undefined` while any field is invalid.
  onChange?: (data: ItemEditorAttributes | undefined) => void;
  stickerFilter?: (item: CS2EconomyItem) => boolean;
  patchFilter?: (item: CS2EconomyItem) => boolean;
}) {
  maxQuantity ??= 0;

  const defaults = item instanceof CS2InventoryItem ? item.asBase() : undefined;

  const hasQuantity = !isDisabled && isItemCountable(item);
  const hasKeychains = !isHideKeychains && item.hasKeychains();
  const hasStickers = !isHideStickers && item.hasStickers();
  const hasPatches = !isHidePatches && item.hasPatches();
  const hasNameTag = !isHideNameTag && item.hasNameTag();
  const hasSeed = !isHideSeed && item.hasSeed();
  const hasHighlight = item.hasHighlights();
  const hasWear = !isHideWear && item.hasWear();
  const hasStatTrak = !isHideStatTrak && item.hasStatTrak();
  const hasSouvenir = !isHideSouvenir && item.hasSouvenir();
  const hasType = hasStatTrak || hasSouvenir;
  const souvenirSources = useMemo(
    () => (hasSouvenir ? item.getSouvenirSources() : []),
    [item, hasSouvenir]
  );
  const hasStyle = !isHideStyle && item.hasStyle();
  const hasUpgradeLevel =
    !isHideUpgradeLevel && item.getUpgradeLevels().length > 1;
  const defaultUpgradeLevel = item.getDefaultUpgradeLevel();
  const minimumSeed = item.getMinimumSeed();
  const minimumWear = item.getMinimumWear();

  const translate = useTranslate();
  const isDesktop = useIsDesktop();
  const { canUse3d, isIdSupported } = useViewerAvailability(item, {
    attachment: true,
    kinds: VIEWER_INSPECT_KINDS
  });

  const use3dStickerPicker =
    canUse3d &&
    !isDisabled &&
    !isHideStickerRotation &&
    !isHideStickerSchema &&
    !isHideStickerWear &&
    !isHideStickerX &&
    !isHideStickerY;

  const use3dKeychainPicker =
    canUse3d &&
    !isDisabled &&
    !isHideKeychainSeed &&
    !isHideKeychainX &&
    !isHideKeychainY &&
    !isHideKeychainZ;

  const use3dPatchPicker = canUse3d && !isDisabled;

  const sticker3dFilter = useCallback(
    (economyItem: CS2EconomyItem) =>
      isIdSupported(economyItem.id) &&
      (stickerFilter === undefined || stickerFilter(economyItem)),
    [isIdSupported, stickerFilter]
  );

  const keychain3dFilter = useCallback(
    (economyItem: CS2EconomyItem) =>
      isIdSupported(economyItem.id) &&
      (keychainFilter === undefined || keychainFilter(economyItem)),
    [isIdSupported, keychainFilter]
  );

  const patch3dFilter = useCallback(
    (economyItem: CS2EconomyItem) =>
      isIdSupported(economyItem.id) &&
      (patchFilter === undefined || patchFilter(economyItem)),
    [isIdSupported, patchFilter]
  );

  const attributesRef = useRef<HTMLDivElement>(null);
  const [isTallEditor, setIsTallEditor] = useState(false);
  // Measures before paint so the editor opens in its final layout. Latches
  // once tall so edits can't flip it back; reset clears the latch to re-measure.
  useLayoutEffect(() => {
    const element = attributesRef.current;
    if (isTallEditor || element === null) {
      return;
    }
    const update = () => {
      if (element.offsetHeight > 250) {
        setIsTallEditor(true);
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [isTallEditor]);
  const isTwoColumn = isDesktop && (item.isWeapon() || isTallEditor);

  const attributes = useKeyValues({
    highlight: defaults?.highlight,
    keychains: defaults?.keychains ?? {},
    nameTag: defaults?.nameTag ?? "",
    patches: defaults?.patches ?? {},
    quantity: defaultQuantity ?? 1,
    seed: defaults?.seed ?? minimumSeed,
    souvenir: hasSouvenir && defaults?.souvenir === true,
    statTrak: defaults?.statTrak !== undefined,
    stickers: defaults?.stickers ?? {},
    style: defaults?.style,
    upgradeLevel: defaults?.upgradeLevel ?? defaultUpgradeLevel,
    wear: defaults?.wear ?? minimumWear
  });

  const [souvenirMatch] = useState(() =>
    hasSouvenir && defaults?.souvenir === true
      ? findSouvenirSelection(
          souvenirSources,
          defaults.stickers ?? {},
          defaults.keychains ?? {}
        )
      : undefined
  );
  const [initialSouvenirSelection] = useState(() =>
    souvenirMatch !== undefined &&
    isSouvenirSelectionComplete(
      souvenirSources[souvenirMatch.sourceIndex],
      souvenirMatch
    )
      ? souvenirMatch
      : undefined
  );
  const [souvenirSelection, setSouvenirSelection] = useState(
    initialSouvenirSelection
  );
  const isSouvenir = hasSouvenir && attributes.value.souvenir;
  const itemType: ItemEditorType = isSouvenir
    ? "souvenir"
    : hasStatTrak && attributes.value.statTrak
      ? "statTrak"
      : "normal";
  const typeOptions = [
    { label: translate("EditorTypeNormal"), value: "normal" as const },
    ...(hasStatTrak
      ? [{ label: translate("EditorStatTrak"), value: "statTrak" as const }]
      : []),
    ...(hasSouvenir
      ? [{ label: translate("EditorSouvenir"), value: "souvenir" as const }]
      : [])
  ];
  const isSouvenirComplete =
    !isSouvenir ||
    souvenirSelection === undefined ||
    isSouvenirSelectionComplete(
      souvenirSources[souvenirSelection.sourceIndex],
      souvenirSelection
    );

  const inputValidity = useKeyValues({
    quantity: true,
    seed: true,
    style: true,
    wear: true
  });

  const nameTag = CS2Economy.trimNameTag(attributes.value.nameTag);
  const isNameTagValid = CS2Economy.safeValidateNameTag(nameTag);
  const isValid =
    (!hasNameTag || isNameTagValid) &&
    (!hasHighlight || attributes.value.highlight !== undefined) &&
    isSouvenirComplete &&
    Object.values(inputValidity.value).every(Boolean);

  function previewSouvenir(selection: SouvenirSelection) {
    const source = souvenirSources[selection.sourceIndex];
    attributes.setValue((current) => ({
      ...current,
      keychains: getSouvenirKeychains(item, current.keychains, selection),
      souvenir: true,
      statTrak: false,
      stickers: getSouvenirStickers(source, selection)
    }));
  }

  function createNewestSouvenirSelection() {
    return createSouvenirSelection(
      souvenirSources,
      getNewestSouvenirSourceIndex(souvenirSources)
    );
  }

  function handleSouvenirChange(selection: SouvenirSelection) {
    setSouvenirSelection(selection);
    previewSouvenir(selection);
  }

  function handleTypeChange(type: ItemEditorType) {
    if (type === "souvenir") {
      handleSouvenirChange(
        souvenirSelection ?? createNewestSouvenirSelection()
      );
      return;
    }
    attributes.setValue((current) => ({
      ...current,
      ...(current.souvenir ? { souvenir: false, stickers: {} } : {}),
      statTrak: type === "statTrak"
    }));
    setSouvenirSelection(undefined);
  }

  async function handleReset() {
    if (
      await confirm({
        titleText: translate("EditorResetConfirmTitle"),
        bodyText: translate("EditorResetConfirm"),
        cancelText: translate("GenericNo"),
        confirmText: translate("GenericYes")
      })
    ) {
      attributes.reset();
      setSouvenirSelection(initialSouvenirSelection);
      setIsTallEditor(false);
    }
  }

  useLayoutEffect(() => {
    if (!isValid) {
      onChange?.(undefined);
      return;
    }
    onChange?.({
      highlight: hasHighlight ? attributes.value.highlight : undefined,
      keychains:
        hasKeychains && hasKeys(attributes.value.keychains)
          ? attributes.value.keychains
          : undefined,
      nameTag: hasNameTag ? nameTag : undefined,
      patches:
        hasPatches && hasKeys(attributes.value.patches)
          ? attributes.value.patches
          : undefined,
      quantity: attributes.value.quantity,
      seed: hasSeed
        ? attributes.value.seed !== CS2_MIN_SEED
          ? attributes.value.seed
          : undefined
        : undefined,
      souvenir: isSouvenir ? true : undefined,
      statTrak:
        hasStatTrak && attributes.value.statTrak
          ? attributes.value.statTrak
          : undefined,
      stickers:
        (isSouvenir || hasStickers) && hasKeys(attributes.value.stickers)
          ? attributes.value.stickers
          : undefined,
      style: hasStyle ? attributes.value.style : undefined,
      upgradeLevel:
        hasUpgradeLevel && attributes.value.upgradeLevel !== defaultUpgradeLevel
          ? attributes.value.upgradeLevel
          : undefined,
      wear: hasWear
        ? attributes.value.wear !== CS2_MIN_WEAR
          ? attributes.value.wear
          : undefined
        : undefined
    });
  }, [attributes.value, isValid]);

  const display = (
    <EditorItemDisplay
      item={item}
      keychains={attributes.value.keychains}
      nameTag={nameTag}
      seed={attributes.value.seed}
      statTrak={
        attributes.value.statTrak ? (defaults?.statTrak ?? 0) : undefined
      }
      stickers={attributes.value.stickers}
      style={attributes.value.style}
      upgradeLevel={attributes.value.upgradeLevel}
      wear={attributes.value.wear}
    />
  );

  const editor = (
    <div ref={attributesRef} className="space-y-1.5">
      {hasType && (
        <EditorLabel
          block={!isDisabled}
          isDisabled={isDisabled}
          label={translate("EditorType")}
        >
          {isDisabled ? (
            <EditorTextValue
              value={
                typeOptions.find((option) => option.value === itemType)?.label
              }
            />
          ) : (
            <div className="mt-1 flex">
              <ItemTypeSegments
                onChange={handleTypeChange}
                options={typeOptions}
                value={itemType}
              />
            </div>
          )}
        </EditorLabel>
      )}
      {isSouvenir &&
        (!isDisabled && souvenirSelection !== undefined ? (
          <SouvenirPanel
            onChange={handleSouvenirChange}
            schemaCount={item.getStickerSchemaCount()}
            sources={souvenirSources}
            value={souvenirSelection}
          />
        ) : (
          <EditorLabel
            isDisabled={isDisabled}
            label={translate("EditorSouvenir")}
          >
            <EditorTextValue
              value={
                souvenirSelection !== undefined
                  ? getSouvenirSourceLabel(
                      souvenirSources[souvenirSelection.sourceIndex]
                    )
                  : undefined
              }
            >
              {!isDisabled && (
                <ButtonWithTooltip
                  tooltip={translate("EditorSouvenirEdit")}
                  className="shrink-0 bg-black/10 p-2 text-neutral-300 transition hover:bg-black/30"
                  onClick={() =>
                    handleSouvenirChange(
                      souvenirMatch ?? createNewestSouvenirSelection()
                    )
                  }
                >
                  <FontAwesomeIcon icon={faPen} className="h-3" />
                </ButtonWithTooltip>
              )}
            </EditorTextValue>
          </EditorLabel>
        ))}
      {hasStickers && !isSouvenir && (
        <EditorLabel block label={translate("EditorStickers")}>
          {use3dStickerPicker ? (
            <Sticker3dPicker
              disabled={isDisabled}
              forItem={item}
              keychains={
                hasKeys(attributes.value.keychains)
                  ? attributes.value.keychains
                  : undefined
              }
              nameTag={nameTag}
              onChange={attributes.update("stickers")}
              seed={attributes.value.seed}
              statTrak={
                attributes.value.statTrak
                  ? (defaults?.statTrak ?? 0)
                  : undefined
              }
              stickerFilter={sticker3dFilter}
              value={attributes.value.stickers}
              wear={attributes.value.wear}
            />
          ) : (
            <StickerPicker
              disabled={isDisabled}
              forItem={item}
              isHideStickerRotation={isHideStickerRotation}
              isHideStickerSchema={isHideStickerSchema}
              isHideStickerWear={isHideStickerWear}
              isHideStickerX={isHideStickerX}
              isHideStickerY={isHideStickerY}
              onChange={attributes.update("stickers")}
              stickerFilter={stickerFilter}
              value={attributes.value.stickers}
            />
          )}
        </EditorLabel>
      )}
      {hasPatches && (
        <EditorLabel block label={translate("EditorPatches")}>
          {use3dPatchPicker ? (
            <Patch3dPicker
              disabled={isDisabled}
              forItem={item}
              onChange={attributes.update("patches")}
              patchFilter={patch3dFilter}
              value={attributes.value.patches}
            />
          ) : (
            <PatchPicker
              patchFilter={patchFilter}
              disabled={isDisabled}
              value={attributes.value.patches}
              onChange={attributes.update("patches")}
            />
          )}
        </EditorLabel>
      )}
      {hasKeychains && !isSouvenir && (
        <EditorLabel block label={translate("EditorKeychains")}>
          {use3dKeychainPicker ? (
            <Keychain3dPicker
              disabled={isDisabled}
              forItem={item}
              keychainFilter={keychain3dFilter}
              nameTag={nameTag}
              onChange={attributes.update("keychains")}
              seed={attributes.value.seed}
              statTrak={
                attributes.value.statTrak
                  ? (defaults?.statTrak ?? 0)
                  : undefined
              }
              stickers={
                hasKeys(attributes.value.stickers)
                  ? attributes.value.stickers
                  : undefined
              }
              value={attributes.value.keychains}
              wear={attributes.value.wear}
            />
          ) : (
            <KeychainPicker
              disabled={isDisabled}
              forItem={item}
              isHideKeychainSeed={isHideKeychainSeed}
              isHideKeychainX={isHideKeychainX}
              isHideKeychainY={isHideKeychainY}
              isHideKeychainZ={isHideKeychainZ}
              keychainFilter={keychainFilter}
              onChange={attributes.update("keychains")}
              value={attributes.value.keychains}
            />
          )}
        </EditorLabel>
      )}
      {hasNameTag && (
        <EditorLabel isDisabled={isDisabled} label={translate("EditorNametag")}>
          <EditorInput
            className={clsx("w-full", isDisabled && "text-right")}
            disabled={isDisabled}
            maxCodePoints={20}
            onChange={attributes.input("nameTag")}
            placeholder={
              isDisabled ? "N/A" : translate("EditorNametagPlaceholder")
            }
            validate={() => isNameTagValid}
            value={attributes.value.nameTag}
          />
        </EditorLabel>
      )}
      {hasHighlight && (
        <HighlightPicker
          disabled={isDisabled}
          highlights={item.getHighlights()}
          onChange={attributes.update("highlight")}
          value={attributes.value.highlight}
        />
      )}
      {hasSeed && (
        <EditorLabel isDisabled={isDisabled} label={translate("EditorPattern")}>
          <EditorStepRangeWithInput
            disabled={isDisabled}
            inputStyles="w-24 min-w-0"
            disabledInputStyles="flex-1 text-right"
            max={item.getMaximumSeed()}
            maxLength={String(item.getMaximumSeed()).length}
            min={minimumSeed}
            onChange={attributes.update("seed")}
            onValidityChange={inputValidity.update("seed")}
            randomizable
            step={CS2_MIN_SEED}
            stepRangeStyles="flex-1"
            type="int"
            validate={(value) => CS2Economy.safeValidateSeed(value, item)}
            value={attributes.value.seed}
          />
        </EditorLabel>
      )}
      {hasStyle && (
        <EditorLabel isDisabled={isDisabled} label={translate("EditorStyle")}>
          <EditorStepRangeWithInput
            disabled={isDisabled}
            disabledInputStyles="flex-1 text-right"
            emptyValue={0}
            inputStyles="w-24 min-w-0"
            max={item.getStyleCount()}
            maxLength={String(item.getStyleCount()).length}
            min={0}
            onChange={(value) =>
              attributes.update("style")(value === 0 ? undefined : value)
            }
            onValidityChange={inputValidity.update("style")}
            placeholder={translate("PetStyleDefault")}
            step={1}
            stepRangeStyles="flex-1"
            type="int"
            validate={(value) => CS2Economy.safeValidateStyle(value, item)}
            value={attributes.value.style ?? 0}
          />
        </EditorLabel>
      )}
      {hasUpgradeLevel && (
        <EditorLabel isDisabled={isDisabled} label={translate("EditorStage")}>
          <EditorSelect
            className="h-7 flex-1 bg-neutral-950/40 px-1 outline-hidden focus:ring-2 focus:ring-blue-500/50 disabled:bg-transparent disabled:text-right"
            disabled={isDisabled}
            onChange={(value) =>
              attributes.update("upgradeLevel")(Number(value))
            }
            options={item.getUpgradeLevels().map((upgradeLevel) => ({
              label: translate(`PetStage${PetStageLabel[upgradeLevel]}`),
              value: String(upgradeLevel)
            }))}
            styleless
            value={String(attributes.value.upgradeLevel)}
          />
        </EditorLabel>
      )}
      {hasWear && (
        <EditorLabel isDisabled={isDisabled} label={translate("EditorWear")}>
          <EditorStepRangeWithInput
            disabled={isDisabled}
            inputStyles="w-24 min-w-0"
            disabledInputStyles="flex-1 text-right"
            max={item.getMaximumWear()}
            maxLength={wearStringMaxLen}
            min={minimumWear}
            onChange={attributes.update("wear")}
            onValidityChange={inputValidity.update("wear")}
            randomizable
            step={CS2_WEAR_FACTOR}
            stepRangeStyles="flex-1"
            transform={wearToString}
            type="float"
            validate={(value) => CS2Economy.safeValidateWear(value, item)}
            value={attributes.value.wear}
          />
        </EditorLabel>
      )}
      {hasQuantity && (
        <EditorLabel
          isDisabled={isDisabled}
          label={translate("EditorQuantity")}
        >
          <EditorStepRangeWithInput
            inputStyles="w-24 min-w-0"
            max={maxQuantity}
            maxLength={String(maxQuantity).length}
            min={1}
            onChange={attributes.update("quantity")}
            onValidityChange={inputValidity.update("quantity")}
            step={1}
            stepRangeStyles="flex-1"
            type="int"
            validate={(value) => value >= 1 && value <= maxQuantity}
            value={attributes.value.quantity}
          />
        </EditorLabel>
      )}
      <div className="flex justify-end">
        <ButtonWithTooltip
          tooltip={translate("EditorReset")}
          className="bg-black/10 p-2 text-neutral-300 transition hover:bg-black/30"
          onClick={handleReset}
        >
          <FontAwesomeIcon icon={faArrowRotateLeft} className="h-4" />
        </ButtonWithTooltip>
      </div>
    </div>
  );

  return (
    <div
      className={clsx(
        "m-auto mt-4 text-sm select-none",
        isTwoColumn ? "w-160" : "w-105",
        className
      )}
    >
      {isTwoColumn ? (
        <div className="flex items-center gap-4">
          <div className="shrink-0">{display}</div>
          <AnimatedHeight className="min-w-0 flex-1">{editor}</AnimatedHeight>
        </div>
      ) : (
        <>
          {display}
          <AnimatedHeight>{editor}</AnimatedHeight>
        </>
      )}
    </div>
  );
}
