import { CS_Economy, CS_Item, CS_MAX_FLOAT, CS_MAX_SEED, CS_MIN_FLOAT, CS_MIN_SEED } from "cslib";
import { useState } from "react";
import { useCheckbox } from "~/hooks/use-checkbox";
import { useInput } from "~/hooks/use-input";
import { EditorInput } from "./editor-input";
import { EditorStepRange } from "./editor-step-range";
import { EditorToggle } from "./editor-toggle";
import { StickerPicker } from "./sticker-picker";

export function CSItemEditor({
  csItem
}: {
  csItem: CS_Item;
}) {
  const [stattrak, setStattrak] = useCheckbox(false);
  const [float, setFloat] = useState(CS_MIN_FLOAT);
  const [seed, setSeed] = useState(1);
  const [nametag, setNametag] = useInput("");
  const [stickers, setStickers] = useState([null, null, null, null] as (
    | number
    | null
  )[]);
  const hasStickers = CS_Economy.hasStickers(csItem);
  const hasStattrak = CS_Economy.hasStattrak(csItem);
  const hasSeed = CS_Economy.hasSeed(csItem);
  const hasFloat = CS_Economy.hasFloat(csItem);
  const hasNametag = CS_Economy.hasNametag(csItem);

  function handleSubmit() {
  }

  return (
    <div className="w-[360px] m-auto pb-6">
      <img
        className="w-[360px] h-[270px]"
        src={CS_Economy.resolveImageSrc("/localimage", csItem.id, float)}
        alt={csItem.name}
        draggable={false}
      />
      <div className="space-y-4">
        {hasStickers && (
          <div>
            <label className="font-bold text-neutral-500 w-[64px] select-none">
              Stickers
            </label>
            <StickerPicker value={stickers} onChange={setStickers} />
          </div>
        )}
        {hasNametag && (
          <div className="flex items-center gap-4">
            <label className="font-bold text-neutral-500 w-[64px] select-none">
              Nametag
            </label>
            <EditorInput
              value={nametag}
              placeholder="Type a custom name..."
              onChange={setNametag}
            />
          </div>
        )}
        {hasSeed && (
          <div className="flex items-center gap-4 select-none">
            <label className="font-bold text-neutral-500 w-[64px]">Seed</label>
            <span className="w-[68px]">{seed}</span>
            <EditorStepRange
              className="flex-1"
              value={seed}
              onChange={setSeed}
              max={CS_MAX_SEED}
              min={CS_MIN_SEED}
              step={CS_MIN_SEED}
            />
          </div>
        )}
        {hasFloat && (
          <div className="flex items-center gap-4 select-none">
            <label className="font-bold text-neutral-500 w-[64px]">Float</label>
            <span className="w-[68px]">{float}</span>
            <EditorStepRange
              className="flex-1"
              value={float}
              onChange={setFloat}
              max={CS_MAX_FLOAT}
              min={CS_MIN_FLOAT}
              step={CS_MIN_FLOAT}
            />
          </div>
        )}
        {hasStattrak && (
          <div className="flex items-center gap-4 select-none">
            <label className="font-bold text-neutral-500 w-[64px]">
              StatTrak™
            </label>
            <EditorToggle
              checked={stattrak}
              onChange={setStattrak}
            />
          </div>
        )}
      </div>
      <div className="flex justify-end mt-2">
        <button
          onClick={handleSubmit}
          className="bg-white/80 hover:bg-white text-neutral-700 px-4 py-2 rounded font-bold drop-shadow-lg transition"
        >
          Craft
        </button>
      </div>
    </div>
  );
}
