/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { nonEmptyString } from "~/utils/misc";

export function ToolsSelect({
  onChange,
  options,
  value
}: {
  onChange: (value?: string) => void;
  options: string[];
  value?: string;
}) {
  return (
    <label>
      Reference:
      <select
        className="h-6 rounded border"
        onChange={(event) => onChange(nonEmptyString(event.target.value))}
        value={value ?? ""}
      >
        <option value="">None</option>
        {options.map((ref) => (
          <option className="bg-black" key={ref} value={ref}>
            {ref}
          </option>
        ))}
      </select>
    </label>
  );
}
