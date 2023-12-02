/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faFloppyDisk, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MetaFunction } from "@remix-run/node";
import { Link, useSubmit } from "@remix-run/react";
import { useState } from "react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { LanguageSelect } from "~/components/language-select";
import { Modal } from "~/components/modal";
import { useRootContext } from "~/components/root-context";
import { useTranslation } from "~/hooks/use-translation";
import { languages } from "~/translations.server";
import { ApiActionPreferencesUrl } from "./api.action.preferences._index";

export const meta: MetaFunction = () => {
  return [{ title: "Settings - CS2 Inventory Simulator" }];
};

export async function loader() {
  return typedjson({
    languages: languages.map(({ name, countries }) => ({
      name,
      country: countries[0]
    }))
  });
}

export default function Settings() {
  const translate = useTranslation();
  const submit = useSubmit();
  const { language: selectedLanguage } = useRootContext();
  const { languages } = useTypedLoaderData<typeof loader>();
  const [language, setLanguage] = useState(selectedLanguage);

  function handleSubmit() {
    submit(
      {
        language
      },
      {
        action: ApiActionPreferencesUrl,
        method: "POST"
      }
    );
  }

  return (
    <Modal className="w-[540px]">
      <div className="flex select-none items-center justify-between px-4 py-2 text-sm font-bold">
        <span className="text-neutral-400">{translate("SettingsHeader")}</span>
        <div className="flex items-center">
          <Link className="opacity-50 hover:opacity-100" to="/">
            <FontAwesomeIcon icon={faXmark} className="h-4" />
          </Link>
        </div>
      </div>
      <div className="px-4">
        <label className="font-bold text-neutral-500">
          {translate("SettingsLanguage")}
        </label>
        <LanguageSelect
          languages={languages}
          value={language}
          onChange={setLanguage}
        />
      </div>
      <div className="mt-6 flex justify-end gap-2 px-4 pb-4">
        <button
          className="flex cursor-default items-center gap-2 rounded bg-white/80 px-2 py-1 font-bold text-neutral-700 drop-shadow-lg transition hover:bg-white disabled:bg-neutral-500 disabled:text-neutral-700"
          onClick={handleSubmit}
        >
          <FontAwesomeIcon icon={faFloppyDisk} className="h-4" />
          {translate("SettingsSave")}
        </button>
      </div>
    </Modal>
  );
}
