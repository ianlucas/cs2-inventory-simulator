/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { faRotate } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { CS_getTeamLabel, CS_Team, CS_toggleTeam } from "cslib";

export function TeamToggle({
  onChange,
  value
}: {
  onChange(newValue: CS_Team): void;
  value: CS_Team;
}) {
  function handleClick() {
    onChange(CS_toggleTeam(value));
  }

  const label = CS_getTeamLabel(value);

  return (
    <button
      className="flex items-center justify-center rounded px-2 pb-2 pt-1 text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200 active:text-white cursor-default gap-2"
      onClick={handleClick}
    >
      <FontAwesomeIcon icon={faRotate} className="w-4 fill-current pt-2" />
      <span className="relative">
        <img
          key={label}
          className="h-6 w-6"
          src={`/images/${label}.svg`}
          alt={label}
          draggable={false}
        />
        <label className="absolute bottom-[-6px] block w-full text-center text-xs uppercase">
          <span className="rounded bg-black/70 px-1 font-bold">{label}</span>
        </label>
      </span>
    </button>
  );
}
