/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faGripVertical, faShuffle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS2EconomyItem, CS2SouvenirSource, ensure } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import {
  PointerEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  createSouvenirSelection,
  getSouvenirAutographs,
  getSouvenirSourceImage,
  getSouvenirSourceName,
  isSouvenirMapFixed,
  moveSouvenirStickerField,
  selectSouvenirHighlight,
  selectSouvenirTeam,
  shuffleSouvenirStickers,
  SouvenirSelection,
  SouvenirStickerField
} from "~/shared/souvenir";
import { useTranslate } from "./app-context";
import { attachmentName } from "./attachment-3d-drawer";
import { ButtonWithTooltip } from "./button-with-tooltip";
import { EditorLabel } from "./editor-label";
import { HighlightPicker } from "./highlight-picker";
import { ItemCombobox, ItemComboboxOption } from "./item-combobox";

function toOption(item: CS2EconomyItem): ItemComboboxOption {
  return { id: item.id, image: item, label: attachmentName(item.name) };
}

export function getSouvenirSourceLabel(source: CS2SouvenirSource) {
  return attachmentName(getSouvenirSourceName(source));
}

export function SouvenirPanel({
  onChange,
  schemaCount,
  sources,
  value
}: {
  onChange: (selection: SouvenirSelection) => void;
  schemaCount: number;
  sources: CS2SouvenirSource[];
  value: SouvenirSelection;
}) {
  const translate = useTranslate();
  const source = ensure(sources[value.sourceIndex]);
  const [teamA, teamB] = value.teamIds;
  const isHighlightSelected = value.highlightId !== undefined;
  const autographs = getSouvenirAutographs(source, value);
  const rowRefs = useRef(new Map<SouvenirStickerField, HTMLDivElement>());
  const [draggedField, setDraggedField] = useState<SouvenirStickerField>();

  const sourceOptions = useMemo(
    () =>
      sources.map((source, index) => {
        const image = getSouvenirSourceImage(source);
        return {
          id: index,
          image,
          label: getSouvenirSourceLabel(source)
        };
      }),
    [sources]
  );
  const teamOptions = (excludedTeamId: number | undefined) =>
    source.teams
      .filter(({ id }) => id !== excludedTeamId)
      .map(({ id, sticker }) => ({ ...toOption(sticker), id }));

  function handleTeam(index: 0 | 1) {
    return function handleTeam(teamId: number) {
      onChange(selectSouvenirTeam(source, value, index, teamId));
    };
  }

  useEffect(() => {
    if (draggedField === undefined) {
      return;
    }
    function handleMove(event: globalThis.PointerEvent) {
      const from = value.order.indexOf(ensure(draggedField));
      const to = value.order.filter((field) => {
        const rect = rowRefs.current.get(field)?.getBoundingClientRect();
        return (
          field !== draggedField &&
          rect !== undefined &&
          event.clientY > rect.top + rect.height / 2
        );
      }).length;
      if (to !== from) {
        onChange(moveSouvenirStickerField(value, from, to));
      }
    }
    function handleEnd() {
      setDraggedField(undefined);
    }
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
    };
  }, [draggedField, onChange, value]);

  function handleDragStart(field: SouvenirStickerField) {
    return function handleDragStart(event: PointerEvent<HTMLElement>) {
      event.preventDefault();
      setDraggedField(field);
    };
  }

  const fields: Record<SouvenirStickerField, () => ReactNode> = {
    autograph: () => (
      <ItemCombobox
        disabled={autographs.length === 0}
        onChange={(autographId) => onChange({ ...value, autographId })}
        options={autographs.map(toOption)}
        placeholder={translate("EditorSouvenirAutographPlaceholder")}
        value={value.autographId}
      />
    ),
    event: () => (
      <ItemCombobox
        disabled={source.eventStickers.length === 1}
        onChange={(eventStickerId) => onChange({ ...value, eventStickerId })}
        options={source.eventStickers.map(toOption)}
        placeholder={translate("EditorSouvenirPlaceholder")}
        value={value.eventStickerId}
      />
    ),
    map: () => (
      <ItemCombobox
        disabled={isSouvenirMapFixed(source)}
        onChange={(mapStickerId) => onChange({ ...value, mapStickerId })}
        options={source.mapStickers.map(toOption)}
        placeholder={translate("EditorSouvenirPlaceholder")}
        value={value.mapStickerId}
      />
    ),
    team0: () => (
      <ItemCombobox
        disabled={isHighlightSelected}
        onChange={handleTeam(0)}
        options={teamOptions(teamB)}
        placeholder={translate("EditorSouvenirPlaceholder")}
        value={teamA}
      />
    ),
    team1: () => (
      <ItemCombobox
        disabled={isHighlightSelected}
        onChange={handleTeam(1)}
        options={teamOptions(teamA)}
        placeholder={translate("EditorSouvenirPlaceholder")}
        value={teamB}
      />
    )
  };
  const labels: Record<SouvenirStickerField, string> = {
    autograph: translate("EditorSouvenirAutograph"),
    event: translate("EditorSouvenirTournament"),
    map: translate("EditorSouvenirMap"),
    team0: `${translate("EditorSouvenirTeam")} 1`,
    team1: `${translate("EditorSouvenirTeam")} 2`
  };

  return (
    <div className="space-y-1.5">
      <EditorLabel label={translate("EditorSouvenirEvent")}>
        <ItemCombobox
          onChange={(sourceIndex) =>
            onChange(createSouvenirSelection(sources, sourceIndex))
          }
          options={sourceOptions}
          placeholder={translate("EditorSouvenirPlaceholder")}
          value={value.sourceIndex}
        />
      </EditorLabel>
      {value.order.map((field) => (
        <div
          className={clsx(
            "transition-opacity",
            draggedField === field && "opacity-60"
          )}
          key={field}
          ref={(element) => {
            if (element !== null) {
              rowRefs.current.set(field, element);
            } else {
              rowRefs.current.delete(field);
            }
          }}
        >
          <EditorLabel label={labels[field]}>
            <div
              className="shrink-0 cursor-grab touch-none px-1 text-neutral-500 hover:text-neutral-300 active:cursor-grabbing"
              onPointerDown={handleDragStart(field)}
            >
              <FontAwesomeIcon className="h-3.5" icon={faGripVertical} />
            </div>
            {fields[field]()}
          </EditorLabel>
        </div>
      ))}
      {value.order.length > 1 && (
        <div className="flex justify-end">
          <ButtonWithTooltip
            className="bg-black/10 p-2 text-neutral-300 transition hover:bg-black/30"
            onClick={() =>
              onChange(shuffleSouvenirStickers(value, schemaCount))
            }
            tooltip={translate("EditorSouvenirShuffle")}
          >
            <FontAwesomeIcon className="h-4" icon={faShuffle} />
          </ButtonWithTooltip>
        </div>
      )}
      {source.highlights.length > 0 && (
        <HighlightPicker
          highlights={source.highlights}
          isHidePreview
          onChange={(highlightId) =>
            onChange(selectSouvenirHighlight(source, value, highlightId))
          }
          value={value.highlightId}
        />
      )}
    </div>
  );
}
