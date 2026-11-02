/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ReactNode, useEffect, useState } from "react";

const FADE_MS = 200;

export function EditorActions({
  children,
  isHidden
}: {
  children: ReactNode;
  isHidden: boolean;
}) {
  const [settledHidden, setSettledHidden] = useState(isHidden);

  useEffect(() => {
    const timeout = setTimeout(() => setSettledHidden(isHidden), FADE_MS);
    return () => clearTimeout(timeout);
  }, [isHidden]);

  return (
    <div
      className={clsx(
        "my-6 flex justify-center gap-2 transition-opacity duration-200",
        isHidden && "opacity-0"
      )}
      inert={isHidden || settledHidden !== isHidden}
    >
      {children}
    </div>
  );
}
