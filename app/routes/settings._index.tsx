/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { useState } from "react";
import { useNavigate, useSubmit } from "react-router";
import { usePreferences, useTranslate } from "~/components/app-context";
import { ChipMenuItem } from "~/components/chip-menu-item";
import { useIsDesktop } from "~/components/hooks/use-is-desktop";
import {
  type SettingsDraft,
  useSettingsGroups
} from "~/components/hooks/use-settings-groups";
import { Modal, ModalHeader } from "~/components/modal";
import { ModalButton } from "~/components/modal-button";
import { SettingsField } from "~/components/settings-field";
import { SideMenuItem } from "~/components/side-menu-item";
import { middleware } from "~/middleware.server";
import { getMetaTitle } from "~/root-meta";
import type { Route } from "./+types/settings._index";
import { ApiActionPreferencesUrl } from "./api.action.preferences._index";

export const meta = getMetaTitle("HeaderSettingsLabel");

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);
  return null;
}

export default function Settings() {
  const preferences = usePreferences();
  const translate = useTranslate();
  const isDesktop = useIsDesktop();
  const groups = useSettingsGroups();
  const submit = useSubmit();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<SettingsDraft>({
    background: preferences.background ?? "",
    hideFilters: preferences.hideFilters,
    hideFreeItems: preferences.hideFreeItems,
    hideNewItemLabel: preferences.hideNewItemLabel,
    itemLanguage: preferences.itemLanguage ?? "",
    language: preferences.language,
    prefer2dStickerEditor: preferences.prefer2dStickerEditor,
    statsForNerds: preferences.statsForNerds
  });
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0].id);
  const selectedGroup =
    groups.find((group) => group.id === selectedGroupId) ?? groups[0];

  function handleChange<K extends keyof SettingsDraft>(
    key: K,
    value: SettingsDraft[K]
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit() {
    submit(draft, {
      action: ApiActionPreferencesUrl,
      method: "POST"
    });
  }

  function handleCancel() {
    return navigate("/", { preventScrollReset: true });
  }

  return (
    <Modal
      className={clsx("flex h-133 flex-col", isDesktop ? "w-160" : "w-135")}
    >
      <ModalHeader title={translate("SettingsHeader")} closeTo="/" />
      <div
        className={clsx(
          "mt-2 flex min-h-0 flex-1",
          !isDesktop && "flex-col gap-2"
        )}
      >
        {isDesktop ? (
          <div className="mb-2 w-55 shrink-0 rounded-r bg-black/10">
            {groups.map((group) => (
              <SideMenuItem
                icon={<FontAwesomeIcon icon={group.icon} className="h-4" />}
                isActive={group.id === selectedGroup.id}
                key={group.id}
                label={group.label}
                onClick={() => setSelectedGroupId(group.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1 px-2">
            {groups.map((group) => (
              <ChipMenuItem
                isActive={group.id === selectedGroup.id}
                key={group.id}
                label={group.label}
                onClick={() => setSelectedGroupId(group.id)}
              />
            ))}
          </div>
        )}
        <div className="relative min-h-0 min-w-0 flex-1">
          {/* Bottom padding matches the button area so the last field can scroll clear of it. */}
          <div
            className="h-full space-y-2 overflow-y-auto px-2 pb-21"
            key={selectedGroup.id}
          >
            {selectedGroup.fields.map((field, index) => (
              <SettingsField
                draft={draft}
                field={field}
                key={index}
                onChange={handleChange}
              />
            ))}
          </div>
          <div className="pointer-events-none absolute bottom-6 left-0 flex w-full justify-center gap-2">
            <ModalButton
              children={translate("GenericCancel")}
              onClick={handleCancel}
              variant="secondary"
            />
            <ModalButton
              children={translate("SettingsSave")}
              onClick={handleSubmit}
              variant="primary"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
