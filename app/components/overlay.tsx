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
    <div className="fixed top-0 left-0 z-50 flex h-full w-full items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      {isWrapperless ? children : <div className={className}>{children}</div>}
    </div>
  );
}
