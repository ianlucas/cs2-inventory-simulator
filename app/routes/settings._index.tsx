/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faTrashCan, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useNavigate, useSubmit } from "@remix-run/react";
import { useState } from "react";
import {
  useInventory,
  useLocalize,
  usePreferences
} from "~/components/app-context";
import { EditorToggle } from "~/components/editor-toggle";
import { useCheckbox } from "~/components/hooks/use-checkbox";
import { useSync } from "~/components/hooks/use-sync";
import { LanguageSelect } from "~/components/language-select";
import { Modal } from "~/components/modal";
import { ModalButton } from "~/components/modal-button";
import { Select } from "~/components/select";
import { SettingsLabel } from "~/components/settings-label";
import { backgrounds } from "~/data/backgrounds";
import { languages } from "~/data/languages";
import { middleware } from "~/http.server";
import { getMetaTitle } from "~/root-meta";
import { ApiActionPreferencesUrl } from "./api.action.preferences._index";
import { RemoveAllItemsAction } from "./api.action.sync._index";

export const meta = getMetaTitle("HeaderSettingsLabel");

export async function loader({ request }: LoaderFunctionArgs) {
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

  function handleRemoveAllItems() {
    if (confirm(localize("SettingsConfirmRemoveAllItems"))) {
      inventory.removeAll();
      setInventory(inventory);
      sync({ type: RemoveAllItemsAction });
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
            className="flex cursor-default items-center gap-2 rounded border border-neutral-500/20 px-2 py-1 font-semibold text-red-500 transition-all hover:border-red-500"
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
