/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { APP_VOLUME_STORAGE_KEY, DEFAULT_APP_VOLUME } from "~/user-storage";
import { useTranslate } from "./app-context";
import { EditorRange } from "./editor-range";
import { useStorageState } from "./hooks/use-storage-state";
import { SettingsLabel } from "./settings-label";

export function SettingsMasterVolume() {
  const translate = useTranslate();
  const [volume, setVolume] = useStorageState(
    APP_VOLUME_STORAGE_KEY,
    DEFAULT_APP_VOLUME
  );

  return (
    <SettingsLabel label={translate("SettingsMasterVolume")}>
      <EditorRange
        format={(value) => (value * 100).toFixed(0).toString()}
        max={1}
        min={0}
        onChange={setVolume}
        step={0.01}
        value={volume}
        valueStyles="w-5 text-right"
      />
    </SettingsLabel>
  );
}
