/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useTranslate } from "./app-context";

export function CraftShareUser({
  hasProfile,
  user: { avatar, id, name }
}: {
  hasProfile: boolean;
  user: {
    avatar: string;
    id: string;
    name: string;
  };
}) {
  const translate = useTranslate();

  const userContents = (
    <>
      <img
        className="size-6 rounded-full"
        src={avatar}
        alt={name}
        draggable={false}
      />
      <span className="truncate">{name}</span>
    </>
  );

  return (
    <div className="m-auto flex w-full max-w-[calc(100%-2rem)] items-center justify-center gap-2 px-4 pt-2 text-xs">
      <span className="text-neutral-500">{translate("CraftBy")}</span>
      {hasProfile ? (
        <a
          className="flex min-w-0 items-center gap-2 hover:underline"
          href={`/profiles/${id}`}
          rel="noopener"
          target="_blank"
        >
          {userContents}
        </a>
      ) : (
        userContents
      )}
    </div>
  );
}
