/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faTrashCan, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useNavigate, useSubmit } from "@remix-run/react";
import { useState } from "react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { EditorToggle } from "~/components/editor-toggle";
import { LanguageSelect } from "~/components/language-select";
import { Modal } from "~/components/modal";
import { ModalButton } from "~/components/modal-button";
import { useRootContext } from "~/components/root-context";
import { Select } from "~/components/select";
import { useCheckbox } from "~/hooks/use-checkbox";
import { useSync } from "~/hooks/use-sync";
import { useTranslation } from "~/hooks/use-translation";
import { middleware } from "~/http.server";
import { backgrounds } from "~/preferences/background.server";
import { languages } from "~/preferences/language.server";
import { ApiActionPreferencesUrl } from "./api.action.preferences._index";
import { RemoveAllItemsAction } from "./api.action.sync._index";

export const meta: MetaFunction = () => {
  return [{ title: "Settings - CS2 Inventory Simulator" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await middleware(request);
  return typedjson({
    backgrounds,
    languages: languages.map(({ name, countries }) => ({
      name,
      country: countries[0]
    }))
  });
}

export default function Settings() {
  const { backgrounds, languages } = useTypedLoaderData<typeof loader>();
  const {
    inventory,
    setInventory,
    preferences: {
      currentBackground: selectedBackground,
      hideFreeItems: selectedHideFreeItems,
      language: selectedLanguage,
      statsForNerds: selectedStatsForNerds
    }
  } = useRootContext();
  const sync = useSync();

  const [language, setLanguage] = useState(selectedLanguage);
  const [background, setBackground] = useState(selectedBackground);
  const [statsForNerds, setStatsForNerds] = useCheckbox(selectedStatsForNerds);
  const [hideFreeItems, setHideFreeItems] = useCheckbox(selectedHideFreeItems);

  const translate = useTranslation();
  const submit = useSubmit();
  const navigate = useNavigate();

  function handleSubmit() {
    submit(
      {
        background,
        hideFreeItems,
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
    if (confirm(translate("SettingsConfirmRemoveAllItems"))) {
      inventory.removeAll();
      setInventory(inventory);
      sync({ type: RemoveAllItemsAction });
      return navigate("/");
    }
  }

  return (
    <Modal className="w-[420px]">
      <div className="flex select-none items-center justify-between px-4 py-2 text-sm font-bold">
        <span className="text-neutral-400">{translate("SettingsHeader")}</span>
        <div className="flex items-center">
          <Link className="opacity-50 hover:opacity-100" to="/">
            <FontAwesomeIcon icon={faXmark} className="h-4" />
          </Link>
        </div>
      </div>
      <div className="space-y-2 px-4">
        <div>
          <label className="text-neutral-500">
            {translate("SettingsLanguage")}
          </label>
          <LanguageSelect
            languages={languages}
            value={language}
            onChange={setLanguage}
          />
        </div>
        <div>
          <label className="text-neutral-500">
            {translate("SettingsBackground")}
          </label>
          <Select
            value={background ?? ""}
            onChange={setBackground}
            options={backgrounds.concat({
              label: translate("SettingsBackgroundRandom"),
              value: ""
            })}
            children={({ label }) => label}
          />
        </div>
        <div>
          <label className="text-neutral-500">
            {translate("SettingsStatsForNerds")}
          </label>
          <div>
            <EditorToggle checked={statsForNerds} onChange={setStatsForNerds} />
          </div>
        </div>
        <div>
          <label className="text-neutral-500">
            {translate("SettingsHideFreeItems")}
          </label>
          <div>
            <EditorToggle checked={hideFreeItems} onChange={setHideFreeItems} />
          </div>
        </div>
      </div>
      <div className="mt-4 px-4">
        {inventory.size() > 0 && (
          <button
            className="flex w-full items-center gap-2 rounded border border-neutral-500/20 px-2 py-1 text-red-500 transition-all hover:border-red-500"
            onClick={handleRemoveAllItems}
          >
            <FontAwesomeIcon icon={faTrashCan} />
            {translate("SettingsRemoveAllItems")}
          </button>
        )}
      </div>
      <div className="mt-6 flex justify-end gap-2 px-4 pb-4">
        <ModalButton
          children={translate("SettingsSave")}
          className="px-2"
          onClick={handleSubmit}
          variant="primary"
        />
      </div>
    </Modal>
  );
}
