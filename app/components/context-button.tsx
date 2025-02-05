/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ComponentProps } from "react";

export function ContextButton(props: ComponentProps<"button">) {
  return (
    <button
      className="block w-full cursor-default px-4 py-1.5 text-left outline-hidden transition hover:bg-black/20 active:bg-black/50"
      {...props}
    />
  );
}
