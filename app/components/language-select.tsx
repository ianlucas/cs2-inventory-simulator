/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ComponentProps } from "react";
import { LanguageName } from "~/data/languages";
import { useTranslate } from "./app-context";
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
  const translate = useTranslate();

  return (
    <Select
      value={value}
      onChange={onChange}
      options={languages.map(({ name, country }) => ({
        flag: country.toUpperCase(),
        label: translate(`Language$${name}`),
        value: name
      }))}
      children={({ flag, label }) => (
        <>
          <img
            src={`/images/flags/${flag}.svg`}
            className="h-[16px] w-[24px]"
            alt={label}
            title={label}
            draggable={false}
          />
          {label}
        </>
      )}
    />
  );
}
