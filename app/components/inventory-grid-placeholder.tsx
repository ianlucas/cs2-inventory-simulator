/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { range } from "~/utils/number";

export function InventoryGridPlaceholder() {
  return range(6).map((index) => <div className="w-38.5" key={index} />);
}
