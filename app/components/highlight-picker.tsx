/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2EconomyItem } from "@ianlucas/cs2-lib";
import { useMemo } from "react";
import { useTranslate } from "./app-context";
import { EditorLabel } from "./editor-label";
import { ItemCombobox } from "./item-combobox";

export function HighlightPicker({
  disabled,
  highlights,
  isHidePreview,
  onChange,
  value
}: {
  disabled?: boolean;
  highlights: CS2EconomyItem[];
  isHidePreview?: boolean;
  onChange: (id: number) => void;
  value: number | undefined;
}) {
  const translate = useTranslate();
  const options = useMemo(
    () =>
      highlights.map((highlight) => ({
        description: highlight.description,
        id: highlight.id,
        label: highlight.name
      })),
    [highlights]
  );
  const videoUrl =
    value !== undefined && !isHidePreview
      ? CS2Economy.getById(value).getVideoUrl("480p")
      : undefined;

  return (
    <>
      <EditorLabel isDisabled={disabled} label={translate("EditorHighlight")}>
        <ItemCombobox
          disabled={disabled}
          onChange={onChange}
          options={options}
          placeholder={translate("EditorHighlightPlaceholder")}
          value={value}
        />
      </EditorLabel>
      {videoUrl !== undefined && (
        <video
          autoPlay
          className="aspect-video w-full rounded-sm bg-black"
          key={videoUrl}
          loop
          muted
          playsInline
          src={videoUrl}
        />
      )}
    </>
  );
}
