/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  LOADOUT_USAGE_MODEL_KEYS,
  getLoadoutUsageToken
} from "~/shared/loadout-defaults";
import type { SystemTranslationTokens } from "~/translation.server";
import { useTranslate } from "./app-context";
import { GameMarkup } from "./game-markup";

export function LoadoutTooltip({
  color,
  modelKey,
  name
}: {
  color?: string;
  modelKey?: string;
  name: string;
}) {
  const translate = useTranslate();
  const description =
    modelKey !== undefined && LOADOUT_USAGE_MODEL_KEYS.includes(modelKey)
      ? translate(getLoadoutUsageToken(modelKey) as SystemTranslationTokens)
      : "";

  return (
    <div className="max-w-xs">
      <div className="text-sm font-bold" style={{ color }}>
        {name}
      </div>
      {description !== "" && (
        <div className="mt-2 border-t border-neutral-700/70 pt-2 leading-relaxed">
          <GameMarkup markup={description} />
        </div>
      )}
    </div>
  );
}
