/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EditorToggle } from "./editor-toggle";
import {
  type SettingsDraft,
  type SettingsGroupField
} from "./hooks/use-settings-groups";
import { Select } from "./select";
import { SettingsLabel } from "./settings-label";

export function SettingsField({
  draft,
  field,
  onChange
}: {
  draft: SettingsDraft;
  field: SettingsGroupField;
  onChange: <K extends keyof SettingsDraft>(
    key: K,
    value: SettingsDraft[K]
  ) => void;
}) {
  switch (field.type) {
    case "toggle":
      return (
        <SettingsLabel label={field.label}>
          <EditorToggle
            checked={draft[field.key]}
            onChange={(event) => onChange(field.key, event.target.checked)}
          />
        </SettingsLabel>
      );

    case "select":
      return (
        <SettingsLabel label={field.label}>
          <Select
            value={draft[field.key]}
            onChange={(value) => onChange(field.key, value)}
            options={field.options}
            children={({ image, label }) => (
              <>
                {image !== undefined && (
                  <img
                    src={image}
                    className="h-4 w-6"
                    alt={label}
                    title={label}
                    draggable={false}
                  />
                )}
                {label}
              </>
            )}
          />
        </SettingsLabel>
      );

    case "custom":
      return <field.component />;
  }
}
