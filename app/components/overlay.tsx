/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ReactNode } from "react";

export function Overlay({
  className,
  children,
  isWrapperless
}: {
  className?: string;
  children: ReactNode;
  isWrapperless?: boolean;
}) {
  return (
    <div className="fixed left-0 top-0 z-50 flex h-full w-full select-none items-center justify-center bg-black/60 backdrop-blur-sm">
      {isWrapperless ? children : <div className={className}>{children}</div>}
    </div>
  );
}
