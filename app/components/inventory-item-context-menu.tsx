/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ComponentProps } from "react";
import { ContextButton } from "./context-button";
import { ContextDivider } from "./context-divider";
import { useTimedState } from "./hooks/use-timed-state";

export function InventoryItemContextButton({
  clickLabel,
  label,
  condition,
  onClick
}: {
  clickLabel?: string;
  condition?: boolean;
  label: string;
  onClick?: () => void;
}) {
  const [clicked, triggerClicked] = useTimedState();

  function handleClick() {
    triggerClicked();
    onClick?.();
  }

  return (
    condition && (
      <ContextButton key={label} onClick={handleClick}>
        {clickLabel !== undefined && clicked ? clickLabel : label}
      </ContextButton>
    )
  );
}

export function InventoryItemContextMenu({
  menu
}: {
  menu: ComponentProps<typeof InventoryItemContextButton>[][];
}) {
  return (
    <>
      {menu.map((group, index) => (
        <div key={index}>
          {group.map((props) => (
            <InventoryItemContextButton {...props} />
          ))}
          {index < menu.length - 1 &&
            group.some(({ condition }) => condition) && <ContextDivider />}
        </div>
      ))}
    </>
  );
}
