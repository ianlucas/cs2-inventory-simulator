/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Highlight, themes } from "prism-react-renderer";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { STEAM_CALLBACK_URL } from "~/env.server";
import { useTranslation } from "~/hooks/use-translation";
import {
  AGENT_PATCH_PREFIX,
  AGENT_PREFIX,
  GLOVE_PREFIX,
  MELEE_PREFIX,
  MUSIC_KIT_PREFIX,
  NAMETAG_PREFIX,
  PAINT_PREFIX,
  PIN_PREFIX,
  SEED_PREFIX,
  STATTRAK_PREFIX,
  STICKER_PREFIX,
  STICKERWEAR_PREFIX,
  WEAR_PREFIX
} from "~/utils/inventory";

export async function loader() {
  return typedjson({
    baseUrl: new URL(STEAM_CALLBACK_URL).origin
  });
}

export default function ApiIndex() {
  const { baseUrl } = useTypedLoaderData<typeof loader>();
  const translate = useTranslation();

  return (
    <div className="m-auto px-4 lg:my-6 lg:w-[1024px] lg:px-0">
      <h1 className="flex select-none items-center justify-between text-lg text-neutral-300 lg:text-xl">
        {translate("APIPageHeader")}
      </h1>
      <div className="mt-4 lg:grid lg:grid-cols-2 lg:gap-4">
        <ApiInterface
          method="GET"
          name="Get User Inventory"
          type="application/json"
          response={`type GetUserInventoryResponse = Array<{
  equipped?: boolean;
  equippedCT?: boolean;
  equippedT?: boolean;
  id: number;
  nametag?: string;
  seed?: number;
  stattrak?: number;
  stickers?: (number | null)[];
  stickerswear?: (number | null)[];
  wear?: number;
}>;`}
          endpoint={`${baseUrl}/api/inventory/{steamID64}.json`}
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
  // Seed equipped for a T and/or CT weapon/melee.
  ["${SEED_PREFIX}{CSTeam}_{ItemDef}"]: number | undefined;
  // Wear equipped for a T and/or CT weapon/melee/glove.
  ["${WEAR_PREFIX}{CSTeam}_{ItemDef}"]: number | undefined;
  // StatTrak count for a T and/or CT weapon/melee.
  ["${STATTRAK_PREFIX}{CSTeam}_{ItemDef}"]: number | undefined;
  // Nametag equipped for a T and/or CT weapon/melee/glove.
  ["${NAMETAG_PREFIX}{CSTeam}_{ItemDef}"]: string | undefined;
  // Whether a T and/or CT weapon has stickers.
  ["${STICKER_PREFIX}{CSTeam}_{ItemDef}"]: boolean | undefined;
  // Sticker equipped for a T and/or CT weapon.
  ["${STICKER_PREFIX}{CSTeam}_{ItemDef}_{StickerSlot}"]: number | undefined;
  // Wear of an equipped sticker for a T and/or CT weapon.
  ["${STICKERWEAR_PREFIX}{CSTeam}_{ItemDef}_{StickerSlot}"]: number | undefined;
};`}
          endpoint={`${baseUrl}/api/equipped/{steamID64}.json`}
        />
      </div>
    </div>
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
    <div className="mt-4 lg:mt-0">
      <div className="flex items-center gap-2">
        <span className="lg:text-lg">{name}</span>
        <span className="text-sm font-bold text-neutral-500">{type}</span>
      </div>
      <div className="mt-1 flex items-center overflow-hidden rounded-tl rounded-tr text-sm">
        <div className="bg-green-500/80 px-2 py-1 font-bold">{method}</div>
        <input
          className="flex-1 bg-neutral-950/80 px-2 py-1 font-mono outline-none"
          value={endpoint}
          readOnly
        />
      </div>
      <div className="overflow-hidden rounded-bl rounded-br bg-[#1e1e1e] p-1">
        <Highlight
          code={response}
          language="typescript"
          theme={themes.vsDark}
          children={({ style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className="h-[256px] overflow-x-auto p-2 text-sm"
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
