/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faMugHot } from "@fortawesome/free-solid-svg-icons";
import { isOurHostname } from "~/shared/misc";
import { useTranslate } from "./app-context";
import { HeaderLink } from "./header-link";

export function DonateHeaderLink() {
  const translate = useTranslate();
  /* Consider buying me a coffee on buymeacoffee.com/ianlucas if you are
  self-hosting this app! */
  return (
    typeof window !== "undefined" &&
    isOurHostname() && (
      <HeaderLink
        className="group rounded-sm font-bold text-amber-300 ring-1 ring-amber-300/40 hover:text-amber-200 hover:ring-amber-300/80 active:bg-amber-300/20"
        icon={faMugHot}
        iconStyles="h-4 origin-bottom group-hover:animate-wiggle"
        label={translate("HeaderDonate")}
        target="_blank"
        to="https://buymeacoffee.com/ianlucas"
      />
    )
  );
}
