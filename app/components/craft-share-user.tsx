/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useLocalize } from "./app-context";

export function CraftShareUser({
  user: { avatar, name }
}: {
  user: {
    avatar: string;
    name: string;
  };
}) {
  const localize = useLocalize();

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm">
      <span className="text-neutral-500">{localize("CraftBy")}</span>
      <img
        className="h-6 w-6 rounded-full"
        src={avatar}
        alt={name}
        draggable={false}
      />
      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
        {name}
      </span>
    </div>
  );
}
