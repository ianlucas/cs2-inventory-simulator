/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBoxesStacked,
  faHammer,
  faSliders,
  faVolumeHigh
} from "@fortawesome/free-solid-svg-icons";
import { ComponentType } from "react";
import {
  useInventory,
  usePreferences,
  useRules,
  useTranslate
} from "~/components/app-context";
import { SettingsMasterVolume } from "~/components/settings-master-volume";
import { SettingsResetInventory } from "~/components/settings-reset-inventory";
import { backgrounds } from "~/data/backgrounds";
import { languages } from "~/data/languages";

// Preferences as submitted by the settings form, where an empty background
// means random.
export type SettingsDraft = Omit<
  ReturnType<typeof usePreferences>,
  "background" | "lang"
> & {
  background: string;
};

type SettingsDraftKey<T> = {
  [K in keyof SettingsDraft]: SettingsDraft[K] extends T ? K : never;
}[keyof SettingsDraft];

export type SettingsGroupField =
  | {
      type: "toggle";
      key: SettingsDraftKey<boolean>;
      label: string;
    }
  | {
      type: "select";
      key: SettingsDraftKey<string>;
      label: string;
      options: { image?: string; label: string; value: string }[];
    }
  | {
      type: "custom";
      component: ComponentType;
    };

export type SettingsGroup = {
  fields: SettingsGroupField[];
  icon: IconDefinition;
  id: string;
  label: string;
};

export function useSettingsGroups(): SettingsGroup[] {
  const translate = useTranslate();
  const { viewerEnabled } = useRules();
  const [inventory] = useInventory();

  const groups: (Omit<SettingsGroup, "fields"> & {
    fields: (SettingsGroupField | false)[];
  })[] = [
    {
      id: "general",
      icon: faSliders,
      label: translate("SettingsGeneral"),
      fields: [
        {
          type: "select",
          key: "language",
          label: translate("SettingsLanguage"),
          options: languages.map(({ countries, name }) => ({
            image: `/images/flags/${countries[0].toUpperCase()}.svg`,
            label: translate(`Language$${name}`),
            value: name
          }))
        },
        {
          type: "select",
          key: "background",
          label: translate("SettingsBackground"),
          options: [
            { label: translate("SettingsBackgroundRandom"), value: "" },
            ...backgrounds
          ]
        },
        {
          type: "toggle",
          key: "statsForNerds",
          label: translate("SettingsStatsForNerds")
        },
        viewerEnabled && {
          type: "toggle",
          key: "prefer2dStickerEditor",
          label: translate("SettingsPrefer2dStickerEditor")
        }
      ]
    },
    {
      id: "audio",
      icon: faVolumeHigh,
      label: translate("SettingsAudio"),
      fields: [{ type: "custom", component: SettingsMasterVolume }]
    },
    {
      id: "inventory",
      icon: faBoxesStacked,
      label: translate("SettingsInventory"),
      fields: [
        {
          type: "toggle",
          key: "hideFreeItems",
          label: translate("SettingsHideFreeItems")
        },
        {
          type: "toggle",
          key: "hideFilters",
          label: translate("SettingsHideFilters")
        },
        inventory.size() > 0 && {
          type: "custom",
          component: SettingsResetInventory
        }
      ]
    },
    {
      id: "craft",
      icon: faHammer,
      label: translate("SettingsCraft"),
      fields: [
        {
          type: "toggle",
          key: "hideNewItemLabel",
          label: translate("SettingsHideNewLabel")
        }
      ]
    }
  ];

  return groups
    .map((group) => ({
      ...group,
      fields: group.fields.filter((field) => field !== false)
    }))
    .filter((group) => group.fields.length > 0);
}
