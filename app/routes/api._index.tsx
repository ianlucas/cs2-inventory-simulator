/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "@remix-run/react";
import { Highlight, themes } from "prism-react-renderer";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { Modal } from "~/components/modal";
import { STEAM_CALLBACK_URL } from "~/env.server";
import { AGENT_PATCH_PREFIX, AGENT_PREFIX, FLOAT_PREFIX, GLOVE_PREFIX, MELEE_PREFIX, MUSIC_KIT_PREFIX, NAMETAG_PREFIX, PAINT_PREFIX, PIN_PREFIX, SEED_PREFIX, STATTRAK_PREFIX, STICKER_PREFIX, STICKERFLOAT_PREFIX } from "~/utils/inventory";

export async function loader() {
  return typedjson({
    baseUrl: new URL(STEAM_CALLBACK_URL).origin
  });
}

export default function ApiIndex() {
  const { baseUrl } = useTypedLoaderData<typeof loader>();

  return (
    <Modal className="w-[540px] pb-3">
      <div className="font-bold px-4 py-2 select-none flex items-center justify-between">
        <span>API</span>
        <div className="flex items-center gap-8">
          <Link to="/">
            <FontAwesomeIcon
              icon={faXmark}
              className="h-4 opacity-50 hover:opacity-100"
            />
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <ApiInterface
          method="GET"
          name="Get User Inventory"
          type="application/json"
          response={`type GetUserInventoryResponse = Array<{
  def?: number;
  equipped?: boolean;
  equippedCT?: boolean;
  equippedT?: boolean;
  float?: number;
  id: number;
  itemid?: number;
  nametag?: string;
  seed?: number;
  stattrak?: boolean;
  stickers?: (number | null)[];
  stickersfloat?: (number | null)[];
}>;`}
          endpoint={`${baseUrl}/api/inventory/{steamID64}`}
        />
        <ApiInterface
          method="GET"
          name="Get User Equipped Items"
          type="application/json"
          response={`type CSTeam = 2 /* T */ | 3 /* CT */;
type ItemDef = number;
type StickerSlot = 0 | 1 | 2 | 3;
type GetUserEquippedItemsResponse = {
  // Music Kit equipped.
  ["${MUSIC_KIT_PREFIX}"]: number | undefined;
  // Pin equipped.
  ["${PIN_PREFIX}"]: number | undefined;
  // Melee equipped for T and/or CT.
  ["${MELEE_PREFIX}{CSTeam}"]: number | undefined;
  // Glove equipped for T and/or CT.
  ["${GLOVE_PREFIX}{CSTeam}"]: number | undefined;
  // Agent equipped for T and/or CT.
  ["${AGENT_PREFIX}{CSTeam}"]: number | undefined;
  // Patch for Agent equipped for T and/or CT.
  ["${AGENT_PATCH_PREFIX}{CSTeam}"]: number | undefined;
  // PaintKit equipped for T and/or CT and a weapon/melee/glove.
  ["${PAINT_PREFIX}{CSTeam}_{ItemDef}"]: number | undefined;
  // Seed equipped for a T and/or CT weapon/melee/glove.
  ["${SEED_PREFIX}{CSTeam}_{ItemDef}"]: number | undefined;
  // Float equipped for a T and/or CT weapon/melee/glove.
  ["${FLOAT_PREFIX}{CSTeam}_{ItemDef}"]: number | undefined;
  // StatTrak equipped for a T and/or CT weapon/melee/glove.
  ["${STATTRAK_PREFIX}{CSTeam}_{ItemDef}"]: boolean | undefined;
  // Float equipped for a T and/or CT weapon/melee/glove.
  ["${NAMETAG_PREFIX}{CSTeam}_{ItemDef}"]: string | undefined;
  // Whether a T and/or CT weapon/melee/glove has stickers.
  ["${STICKER_PREFIX}{CSTeam}_{ItemDef}"]: boolean | undefined;
  // Sticker equipped for a T and/or CT weapon/melee/glove.
  ["${STICKER_PREFIX}{CSTeam}_{ItemDef}_{StickerSlot}"]: number | undefined;
  // Float of an equipped sticker for a T and/or CT weapon/melee/glove.
  ["${STICKERFLOAT_PREFIX}{CSTeam}_{ItemDef}_{StickerSlot}"]: number | undefined;
};`}
          endpoint={`${baseUrl}/api/equipped/{steamID64}.json`}
        />
        <ApiInterface
          method="GET"
          name="Get User Equipped Items"
          type="plain/text"
          response={`{
  // Music Kit equipped.
  "${MUSIC_KIT_PREFIX}" "number"
  // Pin equipped.
  "${PIN_PREFIX}" "number"
  // Melee equipped for T and/or CT.
  "${MELEE_PREFIX}{CSTeam}" "number"
  // Glove equipped for T and/or CT.
  "${GLOVE_PREFIX}{CSTeam}" "number"
  // Agent equipped for T and/or CT.
  "${AGENT_PREFIX}{CSTeam}" "number"
  // Patch for Agent equipped for T and/or CT.
  "${AGENT_PATCH_PREFIX}{CSTeam}" "number"
  // PaintKit equipped for T and/or CT and a weapon/melee/glove.
  "${PAINT_PREFIX}{CSTeam}_{ItemDef}" "number"
  // Seed equipped for a T and/or CT weapon/melee/glove.
  "${SEED_PREFIX}{CSTeam}_{ItemDef}" "number"
  // Float equipped for a T and/or CT weapon/melee/glove.
  "${FLOAT_PREFIX}{CSTeam}_{ItemDef}" "number"
  // StatTrak equipped for a T and/or CT weapon/melee/glove.
  "${STATTRAK_PREFIX}{CSTeam}_{ItemDef}" "{0 | 1}"
  // Float equipped for a T and/or CT weapon/melee/glove.
  "${NAMETAG_PREFIX}{CSTeam}_{ItemDef}" "string"
  // Whether a T and/or CT weapon/melee/glove has stickers.
  "${STICKER_PREFIX}{CSTeam}_{ItemDef}" "{0 | 1}"
  // Sticker equipped for a T and/or CT weapon/melee/glove.
  "${STICKER_PREFIX}{CSTeam}_{ItemDef}_{StickerSlot}" "number"
  // Float of an equipped sticker for a T and/or CT weapon/melee/glove.
  "${STICKERFLOAT_PREFIX}{CSTeam}_{ItemDef}_{StickerSlot}" "number"
}`}
          endpoint={`${baseUrl}/api/equipped/{steamID64}.cfg`}
        />
      </div>
    </Modal>
  );
}

function ApiInterface({
  endpoint,
  method,
  name,
  response,
  type
}: {
  endpoint: string;
  method: string;
  name: string;
  response: string;
  type: string;
}) {
  return (
    <div className="px-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">{name}</span>
        <span className="text-neutral-500 text-sm font-bold">{type}</span>
      </div>
      <div className="mt-1 flex items-center rounded-full overflow-hidden text-sm">
        <div className="px-2 bg-green-500/80 font-bold">
          {method}
        </div>
        <input
          className="flex-1 bg-neutral-950/50 px-2 font-mono outline-none"
          value={endpoint}
          readOnly
        />
      </div>
      <div className="mt-2">
        <Highlight
          code={response}
          language="typescript"
          theme={themes.vsDark}
          children={(
            { style, tokens, getLineProps, getTokenProps }
          ) => (
            <pre
              className="text-sm p-2 rounded mt-2 overflow-x-auto"
              style={style}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        />
      </div>
    </div>
  );
}
