/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_CATEGORY_MENU, CS_CategoryMenuItem } from "@ianlucas/cslib";
import clsx from "clsx";
import { useTranslation } from "~/hooks/use-translation";

export function CategoryMenu({
  onChange,
  value
}: {
  onChange(newValue: CS_CategoryMenuItem): void;
  value: CS_CategoryMenuItem;
}) {
  const translate = useTranslation();

  function handleClick(category: CS_CategoryMenuItem) {
    return function handleClick() {
      onChange(category);
    };
  }

  return (
    <div className="flex flex-wrap px-2 gap-1">
      {CS_CATEGORY_MENU.map((item) => (
        <button
          key={item.category}
          className={clsx(
            "rounded bg-opacity-50 px-2 transition-all hover:text-neutral-200",
            item.category !== value.category && "text-neutral-400",
            item.category === value.category
              && "bg-black/50 text-neutral-200"
          )}
          onClick={handleClick(item)}
        >
          {translate(`Category${item.label}`)}
        </button>
      ))}
    </div>
  );
}
