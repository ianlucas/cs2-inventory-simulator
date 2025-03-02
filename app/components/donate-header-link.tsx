/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faHeart } from "@fortawesome/free-solid-svg-icons";
import { isOurHostname } from "~/utils/misc";
import { useTranslate } from "./app-context";
import { HeaderLink } from "./header-link";

export function DonateHeaderLink() {
  const translate = useTranslate();
  /* Consider donating to the project on donate.cstrike.app if you are
  self-hosting this app! */
  return (
    typeof window !== "undefined" &&
    isOurHostname() && (
      <HeaderLink
        className="font-bold"
        icon={faHeart}
        label={translate("HeaderDonate")}
        target="_blank"
        to="https://www.paypal.com/donate/?hosted_button_id=KKE7AT623ALX2"
      />
    )
  );
}
