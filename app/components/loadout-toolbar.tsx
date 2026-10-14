/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faCheck,
  faFileImport,
  faPen,
  faPlus,
  faTrashCan,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { ComponentProps, ReactNode, useState } from "react";
import { Link } from "react-router";
import {
  LOADOUT_NAME_MAX_LENGTH,
  UserLoadout,
  getActiveLoadout
} from "~/shared/user-loadouts";
import { useRules, useTranslate } from "./app-context";
import { useLoadouts } from "./hooks/use-loadouts";
import { FitMarquee } from "./marquee";
import { confirm, prompt } from "./modal-generic";
import { Select } from "./select";

const NONE = "none";

const BUTTON_STYLES = "flex min-w-0 items-center gap-2 rounded-sm px-3 py-1";

const HOVER_FADE_OUT =
  "transition-[opacity,visibility] group-hover:invisible group-hover:opacity-0";
const HOVER_FADE_IN =
  "invisible opacity-0 transition-[opacity,visibility] group-hover:visible group-hover:opacity-100";

function LoadoutToolbarButton({
  children,
  icon,
  ...props
}: ComponentProps<"button"> & { children: string; icon: IconProp }) {
  return (
    <button
      className={clsx(
        BUTTON_STYLES,
        "bg-black/20 hover:bg-black/40 disabled:bg-black/10 disabled:text-white/40"
      )}
      {...props}
    >
      <FontAwesomeIcon className="h-3.5 shrink-0" icon={icon} />
      <FitMarquee className="max-w-32">{children}</FitMarquee>
    </button>
  );
}

// Once equipped, it shows so, and only offers to unequip on hover. The hover
// waits for the pointer to leave first, so it doesn't flip right after the
// click that equipped it.
function LoadoutEquipButton({
  isEquipped,
  onToggle
}: {
  isEquipped: boolean;
  onToggle: () => void;
}) {
  const translate = useTranslate();
  const [canRevealUnequip, setCanRevealUnequip] = useState(true);

  if (!isEquipped) {
    return (
      <LoadoutToolbarButton
        icon={faCheck}
        onClick={() => {
          setCanRevealUnequip(false);
          onToggle();
        }}
      >
        {translate("LoadoutEquipLoadout")}
      </LoadoutToolbarButton>
    );
  }

  return (
    <button
      className={clsx(
        BUTTON_STYLES,
        "bg-green-700/80 font-bold text-neutral-200 transition-colors",
        canRevealUnequip && "group hover:bg-black/40 hover:text-white"
      )}
      onClick={onToggle}
      onMouseLeave={() => setCanRevealUnequip(true)}
    >
      <span className="grid shrink-0">
        <FontAwesomeIcon
          className={clsx("col-start-1 row-start-1 h-3.5", HOVER_FADE_OUT)}
          icon={faCheck}
        />
        <FontAwesomeIcon
          className={clsx("col-start-1 row-start-1 h-3.5", HOVER_FADE_IN)}
          icon={faXmark}
        />
      </span>
      <span className="grid min-w-0">
        <FitMarquee
          className={clsx("col-start-1 row-start-1 max-w-32", HOVER_FADE_OUT)}
        >
          {translate("LoadoutCurrentlyEquipped")}
        </FitMarquee>
        <FitMarquee
          className={clsx("col-start-1 row-start-1 max-w-32", HOVER_FADE_IN)}
        >
          {translate("LoadoutUnequipLoadout")}
        </FitMarquee>
      </span>
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
    importEquipped,
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
  const active = getActiveLoadout(userLoadouts);
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

  async function handleImportEquipped({ id, name }: UserLoadout) {
    if (
      await confirm({
        bodyText: translate("LoadoutImportEquippedDesc"),
        cancelText: translate("GenericCancel"),
        confirmText: translate("LoadoutImportEquipped"),
        titleText: name
      })
    ) {
      importEquipped(id);
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
      <span className="mr-1 shrink-0 font-bold">
        {translate("HeaderLoadoutLabel")}
      </span>
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
          <FitMarquee className="ml-1 min-w-0 text-white/60">
            {active !== undefined
              ? translate("LoadoutUsing", active.name)
              : translate("LoadoutNotUsing")}
          </FitMarquee>
        </>
      ) : (
        <>
          <LoadoutEquipButton
            isEquipped={selected.id === activeLoadoutId}
            onToggle={() =>
              use(selected.id !== activeLoadoutId ? selected.id : null)
            }
          />
          <LoadoutToolbarButton
            icon={faFileImport}
            onClick={() => handleImportEquipped(selected)}
          >
            {translate("LoadoutImportEquipped")}
          </LoadoutToolbarButton>
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
