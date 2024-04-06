/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ComponentProps } from "react";

export function InfoIcon(props: ComponentProps<"svg">) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" {...props}>
      <path
        fill="#FFF"
        d="M16.18 2.194c-7.699 0-13.938 6.239-13.938 13.938 0 7.698 6.239 13.939 13.938 13.939 7.698 0 13.938-6.241 13.938-13.939-.001-7.698-6.24-13.938-13.938-13.938zm1.644 23.32h-3.289v-13.82h3.289v13.82zM16.18 10.361a1.804 1.804 0 1 1-.002-3.608 1.804 1.804 0 0 1 .002 3.608z"
      />
    </svg>
  );
}
