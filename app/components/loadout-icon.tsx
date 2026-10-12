/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";

export function LoadoutIcon({
  className,
  src
}: {
  className?: string;
  src: string;
}) {
  return (
    <span
      className={clsx(
        "block bg-current mask-contain mask-center mask-no-repeat",
        className
      )}
      style={{ maskImage: `url(${src})` }}
    />
  );
}
