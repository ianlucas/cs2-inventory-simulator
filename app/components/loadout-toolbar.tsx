/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faCheck,
  faPen,
  faPlus,
  faTrashCan,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ComponentProps, ReactNode } from "react";
import { Link } from "react-router";
import { LOADOUT_NAME_MAX_LENGTH, UserLoadout } from "~/shared/user-loadouts";
import { useRules, useTranslate } from "./app-context";
import { useLoadouts } from "./hooks/use-loadouts";
import { confirm, prompt } from "./modal-generic";
import { Select } from "./select";

const NONE = "none";

function LoadoutToolbarButton({
  children,
  icon,
  ...props
}: ComponentProps<"button"> & { icon: IconProp }) {
  return (
    <button
      className="flex items-center gap-2 rounded-sm bg-black/20 px-3 py-1 hover:bg-black/40 disabled:bg-black/10 disabled:text-white/40"
      {...props}
    >
      <FontAwesomeIcon className="h-3.5" icon={icon} />
      {children}
    </button>
  );
}

function LoadoutToolbarRow({ children }: { children: ReactNode }) {
  return (
    <div className="font-display relative z-15 border-b border-white/10 text-sm text-white">
      <div className="m-auto flex h-11 w-5xl items-center gap-2">
        {children}
      </div>
    </div>
  );
}

export function LoadoutToolbar({
  onSelect,
  selected
}: {
  onSelect: (id?: string) => void;
  selected?: UserLoadout;
}) {
  const translate = useTranslate();
  const { appHideAuth, inventoryMaxLoadouts } = useRules();
  const {
    create,
    delete: deleteLoadout,
    loadouts: userLoadouts,
    rename,
    use
  } = useLoadouts();

  if (userLoadouts === undefined) {
    return (
      !appHideAuth && (
        <LoadoutToolbarRow>
          <Link className="underline" to="/sign-in">
            {translate("LoadoutSignIn")}
          </Link>
        </LoadoutToolbarRow>
      )
    );
  }

  const { activeLoadoutId, loadouts } = userLoadouts;
  const active = loadouts.find(({ id }) => id === activeLoadoutId);
  const isFull = loadouts.length >= inventoryMaxLoadouts;

  function promptName(titleText: string, defaultValue?: string) {
    return prompt({
      cancelText: translate("GenericCancel"),
      confirmText: translate("GenericOK"),
      defaultValue,
      maxLength: LOADOUT_NAME_MAX_LENGTH,
      placeholder: translate("LoadoutNamePlaceholder"),
      titleText
    });
  }

  async function handleCreate() {
    const name = await promptName(translate("LoadoutCreateTitle"));
    if (name !== undefined) {
      onSelect(create(name));
    }
  }

  async function handleRename({ id, name }: UserLoadout) {
    const newName = await promptName(translate("LoadoutRenameTitle"), name);
    if (newName !== undefined) {
      rename(id, newName);
    }
  }

  async function handleDelete({ id, name }: UserLoadout) {
    if (
      await confirm({
        bodyText: [
          translate("LoadoutDeleteDesc"),
          ...(id === activeLoadoutId
            ? [translate("LoadoutDeleteInUseDesc")]
            : [])
        ].join("\n"),
        cancelText: translate("GenericCancel"),
        confirmText: translate("LoadoutDelete"),
        titleText: name
      })
    ) {
      deleteLoadout(id);
      onSelect(undefined);
    }
  }

  return (
    <LoadoutToolbarRow>
      <span className="mr-1 font-bold">{translate("HeaderLoadoutLabel")}</span>
      <Select
        children={({ label }) => <span className="truncate">{label}</span>}
        className="w-63.25"
        grayscale
        noMaxHeight
        onChange={(value) => onSelect(value !== NONE ? value : undefined)}
        options={[
          { label: translate("LoadoutNone"), value: NONE },
          ...loadouts.map(({ id, name }) => ({
            label:
              id === activeLoadoutId ? translate("LoadoutInUse", name) : name,
            value: id
          }))
        ]}
        value={selected?.id ?? NONE}
      />
      {selected === undefined ? (
        <>
          <span
            title={
              isFull
                ? translate("LoadoutLimitReached", String(inventoryMaxLoadouts))
                : undefined
            }
          >
            <LoadoutToolbarButton
              disabled={isFull}
              icon={faPlus}
              onClick={handleCreate}
            >
              {translate("LoadoutCreate")}
            </LoadoutToolbarButton>
          </span>
          <span className="ml-1 text-white/60">
            {active !== undefined
              ? translate("LoadoutUsing", active.name)
              : translate("LoadoutNotUsing")}
          </span>
        </>
      ) : (
        <>
          {selected.id !== activeLoadoutId ? (
            <LoadoutToolbarButton
              icon={faCheck}
              onClick={() => use(selected.id)}
            >
              {translate("LoadoutEquipLoadout")}
            </LoadoutToolbarButton>
          ) : (
            <LoadoutToolbarButton icon={faXmark} onClick={() => use(null)}>
              {translate("LoadoutUnequipLoadout")}
            </LoadoutToolbarButton>
          )}
          <LoadoutToolbarButton
            icon={faPen}
            onClick={() => handleRename(selected)}
          >
            {translate("LoadoutRename")}
          </LoadoutToolbarButton>
          <LoadoutToolbarButton
            icon={faTrashCan}
            onClick={() => handleDelete(selected)}
          >
            {translate("LoadoutDelete")}
          </LoadoutToolbarButton>
        </>
      )}
    </LoadoutToolbarRow>
  );
}
