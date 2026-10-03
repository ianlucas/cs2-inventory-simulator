/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useLocation } from "react-router";

export function useRootLayout(): {
  background?: boolean;
  footer?: boolean;
  header?: boolean;
  inventory?: boolean;
  solidHeader?: boolean;
} {
  const { pathname } = useLocation();
  // Profiles render the owner's background and inventory instead.
  const isProfile = pathname.startsWith("/profiles/");

  return {
    background: !isProfile,
    footer: true,
    header: true,
    inventory: !isProfile,
    solidHeader: isProfile
  };
}
