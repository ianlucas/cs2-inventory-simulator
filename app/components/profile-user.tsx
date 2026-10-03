/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export function ProfileUser({
  avatar,
  name
}: {
  avatar: string;
  name: string;
}) {
  return (
    <div className="bg-linear-to-b from-stone-800 to-transparent">
      <div className="m-auto flex items-center gap-4 px-4 py-6 lg:w-5xl lg:px-0">
        <img
          className="size-16 rounded-full"
          src={avatar}
          draggable={false}
          alt={name}
        />
        <span className="font-display min-w-0 truncate text-2xl text-white">
          {name}
        </span>
      </div>
    </div>
  );
}
