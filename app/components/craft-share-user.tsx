/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useTranslate } from "./app-context";

export function CraftShareUser({
  user: { avatar, name }
}: {
  user: {
    avatar: string;
    name: string;
  };
}) {
  const translate = useTranslate();

  return (
    <div className="m-auto flex w-full max-w-[calc(100%-2rem)] items-center justify-center gap-2 px-4 pt-2 text-xs">
      <span className="text-neutral-500">{translate("CraftBy")}</span>
      <img
        className="h-6 w-6 rounded-full"
        src={avatar}
        alt={name}
        draggable={false}
      />
      <span className="overflow-hidden text-ellipsis whitespace-nowrap">
        {name}
      </span>
    </div>
  );
}
