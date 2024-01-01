/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContextButton } from "./context-button";
import { ContextDivider } from "./context-divider";

export function InventoryItemContextMenu({
  menu
}: {
  menu: {
    label: string;
    condition?: boolean;
    onClick?(): void;
  }[][];
}) {
  return (
    <>
      {menu.map((group, index) => (
        <div key={index}>
          {group.map(
            ({ label, condition, onClick }) =>
              condition && (
                <ContextButton key={label} onClick={onClick}>
                  {label}
                </ContextButton>
              )
          )}
          {index < menu.length - 1 &&
            group.some(({ condition }) => condition) && <ContextDivider />}
        </div>
      ))}
    </>
  );
}
