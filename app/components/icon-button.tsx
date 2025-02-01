/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function IconButton({
  onClick,
  title,
  icon
}: {
  onClick: () => void;
  title: string;
  icon: IconProp;
}) {
  return (
    <button
      className="flex h-8 cursor-default items-center gap-1 bg-black/10 px-2 text-neutral-300 transition hover:bg-black/30 hover:text-red-500 active:bg-black/60"
      onClick={onClick}
      title={title}
    >
      <FontAwesomeIcon icon={icon} className="h-4" />
    </button>
  );
}
