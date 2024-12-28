/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faTrashCan, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Link, useNavigate, useSubmit } from "react-router";
import {
  useInventory,
  useLocalize,
  usePreferences
} from "~/components/app-context";
import { EditorRange } from "~/components/editor-range";
import { EditorToggle } from "~/components/editor-toggle";
import { useCheckbox } from "~/components/hooks/use-checkbox";
import { useStorageState } from "~/components/hooks/use-storage-state";
import { useSync } from "~/components/hooks/use-sync";
import { LanguageSelect } from "~/components/language-select";
import { Modal } from "~/components/modal";
import { ModalButton } from "~/components/modal-button";
import { confirm } from "~/components/modal-generic";
import { Select } from "~/components/select";
import { SettingsLabel } from "~/components/settings-label";
import { backgrounds } from "~/data/backgrounds";
import { languages } from "~/data/languages";
import { SyncAction } from "~/data/sync";
import { middleware } from "~/http.server";
import { getMetaTitle } from "~/root-meta";
import type { Route } from "./+types/settings._index";
import { ApiActionPreferencesUrl } from "./api.action.preferences._index";

export const meta = getMetaTitle("HeaderSettingsLabel");

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);
  return null;
}

export default function Settings() {
  const {
    background: selectedBackground,
    hideFilters: selectedHideFilters,
    hideFreeItems: selectedHideFreeItems,
    language: selectedLanguage,
    statsForNerds: selectedStatsForNerds
  } = usePreferences();
  const [inventory, setInventory] = useInventory();
  const localize = useLocalize();
  const sync = useSync();

  const [background, setBackground] = useState(selectedBackground ?? "");
  const [hideFilters, setHideFilters] = useCheckbox(selectedHideFilters);
  const [hideFreeItems, setHideFreeItems] = useCheckbox(selectedHideFreeItems);
  const [language, setLanguage] = useState(selectedLanguage);
  const [statsForNerds, setStatsForNerds] = useCheckbox(selectedStatsForNerds);
  const [volume, setVolume] = useStorageState("appVolume", 1);

  const submit = useSubmit();
  const navigate = useNavigate();

  function handleSubmit() {
    submit(
      {
        background,
        hideFreeItems,
        hideFilters,
        language,
        statsForNerds
      },
      {
        action: ApiActionPreferencesUrl,
        method: "POST"
      }
    );
  }

  async function handleRemoveAllItems() {
    if (
      await confirm({
        titleText: localize("SettingsRemoveAllItems"),
        bodyText: localize("SettingsConfirmRemoveAllItems"),
        cancelText: localize("EditorCancel"),
        confirmText: localize("InventoryItemStorageUnitEmptyClose")
      })
    ) {
      inventory.removeAll();
      setInventory(inventory);
      sync({ type: SyncAction.RemoveAllItems });
      return navigate("/");
    }
  }

  return (
    <Modal className="w-[420px]">
      <div className="flex select-none items-center justify-between px-4 py-2 text-sm font-bold">
        <span className="text-neutral-400">{localize("SettingsHeader")}</span>
        <div className="flex items-center">
          <Link className="opacity-50 hover:opacity-100" to="/">
            <FontAwesomeIcon icon={faXmark} className="h-4" />
          </Link>
        </div>
      </div>
      <div className="space-y-2 px-4">
        <SettingsLabel label={localize("SettingsMasterVolume")}>
          <EditorRange
            format={(value) => `${(value * 100).toFixed(0)}%`}
            max={1}
            min={0}
            onChange={setVolume}
            step={0.01}
            value={volume}
          />
        </SettingsLabel>
        <SettingsLabel label={localize("SettingsLanguage")}>
          <LanguageSelect
            languages={languages.map(({ name, countries }) => ({
              name,
              country: countries[0]
            }))}
            value={language}
            onChange={setLanguage}
          />
        </SettingsLabel>
        <SettingsLabel label={localize("SettingsBackground")}>
          <Select
            value={background ?? ""}
            onChange={setBackground}
            options={[
              {
                label: localize("SettingsBackgroundRandom"),
                value: ""
              },
              ...backgrounds
            ]}
            children={({ label }) => label}
          />
        </SettingsLabel>
        <SettingsLabel label={localize("SettingsStatsForNerds")}>
          <EditorToggle checked={statsForNerds} onChange={setStatsForNerds} />
        </SettingsLabel>
        <SettingsLabel label={localize("SettingsHideFreeItems")}>
          <EditorToggle checked={hideFreeItems} onChange={setHideFreeItems} />
        </SettingsLabel>
        <SettingsLabel label={localize("SettingsHideFilters")}>
          <EditorToggle checked={hideFilters} onChange={setHideFilters} />
        </SettingsLabel>
      </div>
      <div className="mt-4 px-4">
        {inventory.size() > 0 && (
          <button
            className="flex cursor-default items-center gap-2 rounded border border-neutral-500/20 px-2 py-1 font-display text-red-500 transition-all hover:border-red-500"
            onClick={handleRemoveAllItems}
          >
            <FontAwesomeIcon icon={faTrashCan} className="h-4" />
            {localize("SettingsRemoveAllItems")}
          </button>
        )}
      </div>
      <div className="mt-6 flex justify-end gap-2 px-4 pb-4">
        <ModalButton
          children={localize("SettingsSave")}
          onClick={handleSubmit}
          variant="primary"
        />
      </div>
    </Modal>
  );
}
