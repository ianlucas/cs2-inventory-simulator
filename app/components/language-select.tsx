/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useTranslation } from "~/hooks/use-translation";
import { Select } from "./select";
import { ComponentProps } from "react";

export function LanguageSelect({
  languages,
  onChange,
  value
}: {
  languages: {
    name: string;
    country: string;
  }[];
} & Omit<ComponentProps<typeof Select>, "children" | "options">) {
  const translate = useTranslation();
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
            src={`/countries/${label}.svg`}
            className="h-[24px] w-[34px]"
            alt={translate(`LanguageN${value}`)}
            title={translate(`LanguageN${value}`)}
            draggable={false}
          />
          {translate(`LanguageN${value}`)}
        </>
      )}
    />
  );
}
