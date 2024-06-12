/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ComponentProps } from "react";
import { LanguageName } from "~/data/languages";
import { useLocalize } from "./app-context";
import { Select } from "./select";

export function LanguageSelect({
  languages,
  onChange,
  value
}: {
  languages: {
    name: LanguageName;
    country: string;
  }[];
} & Omit<ComponentProps<typeof Select>, "children" | "options">) {
  const localize = useLocalize();

  return (
    <Select
      value={value}
      onChange={onChange}
      options={languages.map(({ name, country }) => ({
        label: country,
        value: name
      }))}
      children={({ label, value }) => (
        <>
          <img
            src={`/images/flags/${label.toUpperCase()}.svg`}
            className="h-[16px] w-[24px]"
            alt={localize(`LanguageN${value}`)}
            title={localize(`LanguageN${value}`)}
            draggable={false}
          />
          {localize(`LanguageN${value}`)}
        </>
      )}
    />
  );
}
