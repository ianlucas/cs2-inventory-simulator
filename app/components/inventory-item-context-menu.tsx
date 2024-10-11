/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ComponentProps, useState } from "react";
import { ContextButton } from "./context-button";
import { ContextDivider } from "./context-divider";
import { useTimedState } from "./hooks/use-timed-state";

export function InventoryItemContextButton({
  label,
  condition,
  onClick,
  ...props
}: {
  clickLabel?: string;
  condition?: boolean;
  label: string;
  onClick?: (hooks: { setClickLabel: (value: string) => void }) => void;
}) {
  const [clickLabel, setClickLabel] = useState(props.clickLabel);
  const [clicked, triggerClicked] = useTimedState();

  function handleClick() {
    onClick?.({ setClickLabel });
    triggerClicked();
  }

  return (
    condition && (
      <ContextButton onClick={handleClick}>
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
          {group.map((props, itemIndex) => (
            <InventoryItemContextButton key={itemIndex} {...props} />
          ))}
          {index < menu.length - 1 &&
            group.some(({ condition }) => condition) && <ContextDivider />}
        </div>
      ))}
    </>
  );
}
