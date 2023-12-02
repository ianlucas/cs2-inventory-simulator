/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useClickAway } from "@uidotdev/usehooks";
import clsx from "clsx";
import { useState } from "react";
import { useTranslation } from "~/hooks/use-translation";

export function LanguageSelect({
  languages,
  value,
  onChange
}: {
  languages: {
    name: string;
    country: string;
  }[];
  value: string;
  onChange(value: string): void;
}) {
  const translate = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickAway(() => {
    setIsOpen(false);
  });
  const selected = languages.find(({ name }) => name === value)!;

  return (
    <div className="relative">
      <button
        className="flex min-w-[253px] cursor-default items-center gap-2 rounded bg-black/20 px-2 py-1 hover:bg-black/40"
        onClick={() => setIsOpen(true)}
      >
        <img
          src={`/countries/${selected.country}.svg`}
          className="h-[24px] w-[34px]"
          alt={selected.country}
        />
        <label className="flex-1 text-left">
          {translate(`LanguageN${selected.name}`)}
        </label>
        <FontAwesomeIcon icon={faCaretDown} className="h-4" />
      </button>
      {isOpen && (
        <div
          className="absolute left-0 z-10 max-h-[128px] min-w-[253px] overflow-y-scroll bg-neutral-800"
          ref={ref as any}
        >
          {languages.map(({ name, country }) => {
            return (
              <button
                key={name}
                className={clsx(
                  "flex w-full cursor-default items-center gap-2 px-2 py-1 transition-all",
                  value === name && "bg-white/50",
                  value !== name && "hover:bg-black/30"
                )}
                onClick={() => {
                  onChange(name);
                  setIsOpen(false);
                }}
              >
                <img
                  src={`/countries/${country}.svg`}
                  className="h-[24px] w-[34px]"
                  alt={country}
                />
                {translate(`LanguageN${name}`)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
