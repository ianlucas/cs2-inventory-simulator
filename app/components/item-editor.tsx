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
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
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
import { EditorToggle } from "./editor-toggle";
import { HighlightPicker } from "./highlight-picker";
import { useIsDesktop } from "./hooks/use-is-desktop";
import { useKeyValues } from "./hooks/use-key-values";
import { useTimer } from "./hooks/use-timer";
import { useViewerAvailability } from "./hooks/use-viewer-availability";
import { Keychain3dPicker } from "./keychain-3d-picker";
import { KeychainPicker } from "./keychain-picker";
import { Marquee } from "./marquee";
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

const SOUVENIR_FADE_MS = 200;
const SOUVENIR_MOVE_MS = 250;
const SOUVENIR_ROW_GAP_PX = 6;

type SouvenirPhase =
  | "closed"
  | "hiding-fields"
  | "raising"
  | "open"
  | "hiding-panel"
  | "relaying"
  | "lowering";

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
  onSouvenirPanelChange,
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
  onSouvenirPanelChange?: (isOpen: boolean) => void;
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

  const [initialSouvenirSelection] = useState(() =>
    hasSouvenir && defaults?.souvenir === true
      ? findSouvenirSelection(
          souvenirSources,
          defaults.stickers ?? {},
          defaults.keychains ?? {}
        )
      : undefined
  );
  const [souvenirSelection, setSouvenirSelection] = useState(
    initialSouvenirSelection
  );
  const [souvenirDraft, setSouvenirDraft] = useState<{
    selection: SouvenirSelection;
    snapshot: {
      keychains: typeof attributes.value.keychains;
      selection: SouvenirSelection | undefined;
      souvenir: boolean;
      statTrak: boolean;
      stickers: typeof attributes.value.stickers;
    };
  }>();
  const [souvenirPhase, setSouvenirPhase] = useState<SouvenirPhase>("closed");
  const [souvenirRowMetrics, setSouvenirRowMetrics] = useState({
    height: 0,
    offset: 0
  });
  const souvenirRowRef = useRef<HTMLDivElement>(null);
  const souvenirPanelRef = useRef<HTMLDivElement>(null);
  const [souvenirPanelHeight, setSouvenirPanelHeight] = useState(0);
  const timer = useTimer();
  const isSouvenir = hasSouvenir && attributes.value.souvenir;
  const isAttributeRowsHidden = souvenirPhase !== "closed";
  const isSouvenirRowRaised =
    souvenirPhase === "raising" ||
    souvenirPhase === "open" ||
    souvenirPhase === "hiding-panel" ||
    souvenirPhase === "relaying";
  const isSouvenirPanelShown = souvenirPhase === "open";
  const isSouvenirLayoutFrozen =
    souvenirPhase === "hiding-fields" ||
    souvenirPhase === "raising" ||
    souvenirPhase === "open" ||
    souvenirPhase === "hiding-panel";
  const isSouvenirLaidOut =
    isSouvenirLayoutFrozen && souvenirDraft !== undefined
      ? souvenirDraft.snapshot.souvenir
      : isSouvenir;
  const isSouvenirDraftComplete =
    souvenirDraft !== undefined &&
    isSouvenirSelectionComplete(
      souvenirSources[souvenirDraft.selection.sourceIndex],
      souvenirDraft.selection
    );

  useEffect(() => {
    onSouvenirPanelChange?.(isAttributeRowsHidden);
  }, [isAttributeRowsHidden]);

  const isSouvenirPanelMounted = souvenirDraft !== undefined;
  useLayoutEffect(() => {
    const element = souvenirPanelRef.current;
    if (element === null) {
      return;
    }
    const update = () => setSouvenirPanelHeight(element.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [isSouvenirPanelMounted]);

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
    souvenirDraft === undefined &&
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

  function openSouvenirPanel(selection: SouvenirSelection, preview: boolean) {
    const row = souvenirRowRef.current;
    setSouvenirRowMetrics({
      height: row?.offsetHeight ?? 0,
      offset: row?.offsetTop ?? 0
    });
    setSouvenirPhase("hiding-fields");
    timer(() => setSouvenirPhase("raising"), SOUVENIR_FADE_MS);
    timer(() => setSouvenirPhase("open"), SOUVENIR_FADE_MS + SOUVENIR_MOVE_MS);
    setSouvenirDraft({
      selection,
      snapshot: {
        keychains: attributes.value.keychains,
        selection: souvenirSelection,
        souvenir: attributes.value.souvenir,
        statTrak: attributes.value.statTrak,
        stickers: attributes.value.stickers
      }
    });
    if (preview) {
      previewSouvenir(selection);
    }
  }

  function closeSouvenirPanel() {
    setSouvenirPhase("hiding-panel");
    timer(() => setSouvenirPhase("relaying"), SOUVENIR_FADE_MS);
  }

  useLayoutEffect(() => {
    if (souvenirPhase !== "relaying") {
      return;
    }
    const offset = souvenirRowRef.current?.offsetTop ?? 0;
    setSouvenirRowMetrics((metrics) => ({ ...metrics, offset }));
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        setSouvenirPhase("lowering");
        timer(() => {
          setSouvenirPhase("closed");
          setSouvenirDraft(undefined);
        }, SOUVENIR_MOVE_MS);
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [souvenirPhase]);

  function handleSouvenirChange(selection: SouvenirSelection) {
    previewSouvenir(selection);
    setSouvenirDraft((draft) => draft && { ...draft, selection });
  }

  function handleSouvenirDone() {
    if (souvenirDraft === undefined) {
      return;
    }
    previewSouvenir(souvenirDraft.selection);
    setSouvenirSelection(souvenirDraft.selection);
    closeSouvenirPanel();
  }

  function handleSouvenirCancel() {
    if (souvenirDraft === undefined) {
      return;
    }
    const { selection, ...snapshot } = souvenirDraft.snapshot;
    attributes.setValue((current) => ({ ...current, ...snapshot }));
    setSouvenirSelection(selection);
    closeSouvenirPanel();
  }

  function handleSouvenirToggle(checked: boolean) {
    if (checked) {
      openSouvenirPanel(
        souvenirSelection ??
          createSouvenirSelection(
            souvenirSources,
            getNewestSouvenirSourceIndex(souvenirSources)
          ),
        true
      );
      return;
    }
    attributes.setValue((current) => ({
      ...current,
      souvenir: false,
      stickers: {}
    }));
    setSouvenirSelection(undefined);
  }

  function handleStatTrakToggle(checked: boolean) {
    attributes.setValue((current) => ({
      ...current,
      ...(checked && current.souvenir ? { souvenir: false, stickers: {} } : {}),
      statTrak: checked
    }));
    if (checked) {
      setSouvenirSelection(undefined);
    }
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
    <div
      ref={attributesRef}
      className="relative"
      style={
        isSouvenirLayoutFrozen
          ? {
              minHeight:
                souvenirRowMetrics.height +
                SOUVENIR_ROW_GAP_PX +
                souvenirPanelHeight
            }
          : undefined
      }
    >
      <div className="space-y-1.5">
        <div
          className={clsx(
            "space-y-1.5 transition-opacity duration-200 empty:hidden",
            isAttributeRowsHidden && "opacity-0"
          )}
          inert={isAttributeRowsHidden}
        >
          {hasStickers && !isSouvenirLaidOut && (
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
          {hasKeychains && !isSouvenirLaidOut && (
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
            <EditorLabel
              isDisabled={isDisabled}
              label={translate("EditorNametag")}
            >
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
            <EditorLabel
              isDisabled={isDisabled}
              label={translate("EditorPattern")}
            >
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
            <EditorLabel
              isDisabled={isDisabled}
              label={translate("EditorStyle")}
            >
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
            <EditorLabel
              isDisabled={isDisabled}
              label={translate("EditorStage")}
            >
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
            <EditorLabel
              isDisabled={isDisabled}
              label={translate("EditorWear")}
            >
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
          {hasStatTrak && !isSouvenirLaidOut && (
            <EditorLabel
              isDisabled={isDisabled}
              label={translate("EditorStatTrak")}
            >
              <EditorToggle
                checkedLabel={translate("GenericYes")}
                uncheckedLabel={translate("GenericNo")}
                disabled={isDisabled}
                checked={attributes.value.statTrak}
                onChange={(event) => handleStatTrakToggle(event.target.checked)}
              />
            </EditorLabel>
          )}
        </div>
        {hasSouvenir && (
          <div
            ref={souvenirRowRef}
            className={clsx(
              "relative z-10",
              souvenirPhase !== "relaying" &&
                "transition-transform duration-250 ease-out"
            )}
            style={{
              transform: isSouvenirRowRaised
                ? `translateY(${-souvenirRowMetrics.offset}px)`
                : undefined
            }}
          >
            <EditorLabel
              isDisabled={isDisabled}
              label={translate("EditorSouvenir")}
            >
              <div className="relative flex min-w-0 flex-1 items-center gap-2">
                <div
                  className={clsx(
                    "flex min-w-0 flex-1 items-center gap-2",
                    isAttributeRowsHidden
                      ? "opacity-0"
                      : "transition-opacity duration-200"
                  )}
                  inert={isAttributeRowsHidden}
                >
                  {isSouvenir && !isDisabled && (
                    <ButtonWithTooltip
                      tooltip={translate("EditorSouvenirEdit")}
                      className="shrink-0 bg-black/10 p-2 text-neutral-300 transition hover:bg-black/30"
                      onClick={() =>
                        openSouvenirPanel(
                          souvenirSelection ??
                            createSouvenirSelection(
                              souvenirSources,
                              getNewestSouvenirSourceIndex(souvenirSources)
                            ),
                          souvenirSelection === undefined
                        )
                      }
                    >
                      <FontAwesomeIcon icon={faPen} className="h-3" />
                    </ButtonWithTooltip>
                  )}
                  {isSouvenir && souvenirSelection !== undefined && (
                    <Marquee className="text-neutral-300">
                      {getSouvenirSourceLabel(
                        souvenirSources[souvenirSelection.sourceIndex]
                      )}
                    </Marquee>
                  )}
                  <div className="ml-auto shrink-0">
                    <EditorToggle
                      uncheckedLabel={translate("GenericNo")}
                      disabled={isDisabled}
                      checked={attributes.value.souvenir}
                      onChange={(event) =>
                        handleSouvenirToggle(event.target.checked)
                      }
                    />
                  </div>
                </div>
                <div
                  className={clsx(
                    "absolute inset-y-0 right-0 flex items-center gap-1 transition-opacity duration-200",
                    !isSouvenirPanelShown && "opacity-0"
                  )}
                  inert={!isSouvenirPanelShown}
                >
                  <button
                    className="cursor-default bg-black/10 px-3 py-1 text-neutral-300 transition hover:bg-black/30"
                    onClick={handleSouvenirCancel}
                    type="button"
                  >
                    {translate("EditorCancel")}
                  </button>
                  <button
                    className="cursor-default bg-blue-600/80 px-3 py-1 text-white transition hover:bg-blue-500 disabled:bg-neutral-700 disabled:text-neutral-400"
                    disabled={!isSouvenirDraftComplete}
                    onClick={handleSouvenirDone}
                    type="button"
                  >
                    {translate("EditorSouvenirDone")}
                  </button>
                </div>
              </div>
            </EditorLabel>
          </div>
        )}
        <div
          className={clsx(
            "space-y-1.5 transition-opacity duration-200",
            isAttributeRowsHidden && "opacity-0"
          )}
          inert={isAttributeRowsHidden}
        >
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
      </div>
      {souvenirDraft !== undefined && (
        <div
          className={clsx(
            "absolute inset-x-0 bottom-0 overflow-y-auto transition-opacity duration-200",
            !isSouvenirPanelShown && "opacity-0"
          )}
          inert={!isSouvenirPanelShown}
          style={{ top: souvenirRowMetrics.height + SOUVENIR_ROW_GAP_PX }}
        >
          <div ref={souvenirPanelRef}>
            <SouvenirPanel
              onChange={handleSouvenirChange}
              schemaCount={item.getStickerSchemaCount()}
              sources={souvenirSources}
              value={souvenirDraft.selection}
            />
          </div>
        </div>
      )}
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
