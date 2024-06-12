/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faGratipay } from "@fortawesome/free-brands-svg-icons";
import { useLocalize } from "./app-context";
import { HeaderLink } from "./header-link";

export function DonateHeaderLink() {
  const localize = useLocalize();
  /* Consider donating to the project on donate.cstrike.app if you are
  self-hosting this app! */
  return (
    typeof window !== "undefined" &&
    ["inventory.cstrike.app", "localhost"].includes(
      window.location.hostname
    ) && (
      <HeaderLink
        className="font-bold"
        icon={faGratipay}
        label={localize("HeaderDonate")}
        target="_blank"
        to="https://donate.cstrike.app"
      />
    )
  );
}
