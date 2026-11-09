/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ReactNode } from "react";

export function EditorActions({ children }: { children: ReactNode }) {
  return <div className="my-6 flex justify-center gap-2">{children}</div>;
}
