/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ReactNode } from "react";

export function CaseOpeningFooter({
  left,
  right
}: {
  left?: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="m-auto flex min-h-[63px] max-w-[800px] items-center justify-between border-t border-t-white/10 pt-1.5 drop-shadow">
      {left}
      <div className="flex flex-1 items-center justify-end gap-2 font-display text-lg">
        {right}
      </div>
    </div>
  );
}
