/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2InventoryItem } from "@ianlucas/cs2-lib";
import {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState
} from "react";
import { LoadoutSlot, LoadoutTeam } from "~/shared/loadout";
import { playSound } from "~/sound.client";

export interface LoadoutDropTarget {
  team: LoadoutTeam;
  slot?: LoadoutSlot;
}

const DRAG_THRESHOLD_PX = 4;

function findDropTarget(x: number, y: number): LoadoutDropTarget | undefined {
  const element = document
    .elementFromPoint(x, y)
    ?.closest<HTMLElement>("[data-loadout-team]");
  if (element === null || element === undefined) {
    return undefined;
  }
  return {
    team: Number(element.dataset.loadoutTeam) as LoadoutTeam,
    slot: element.dataset.loadoutSlot as LoadoutSlot | undefined
  };
}

function isSameTarget(a?: LoadoutDropTarget, b?: LoadoutDropTarget) {
  return a?.team === b?.team && a?.slot === b?.slot;
}

// Only the hovered target lives in state: the ghost follows the pointer
// through its style so moving it doesn't re-render the page.
export function useLoadoutDrag(
  onDrop: (item: CS2InventoryItem, target?: LoadoutDropTarget) => void
) {
  const [drag, setDrag] = useState<{
    item: CS2InventoryItem;
    target?: LoadoutDropTarget;
  }>();
  const pressRef = useRef<{
    dragging: boolean;
    item: CS2InventoryItem;
    x: number;
    y: number;
  }>(undefined);
  const pointerRef = useRef({ x: 0, y: 0 });
  const ghostRef = useRef<HTMLElement>(null);
  const wasDraggedRef = useRef(false);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  function moveGhost() {
    const { x, y } = pointerRef.current;
    ghostRef.current?.style.setProperty("translate", `${x}px ${y}px`);
  }

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const press = pressRef.current;
      if (press === undefined) {
        return;
      }
      const { clientX: x, clientY: y } = event;
      if (
        !press.dragging &&
        Math.hypot(x - press.x, y - press.y) < DRAG_THRESHOLD_PX
      ) {
        return;
      }
      if (!press.dragging) {
        press.dragging = true;
        playSound("inventory_item_pickup");
      }
      pointerRef.current = { x, y };
      moveGhost();
      const target = findDropTarget(x, y);
      setDrag((current) =>
        current !== undefined && isSameTarget(current.target, target)
          ? current
          : { item: press.item, target }
      );
    }

    function handlePointerUp(event: PointerEvent) {
      const press = pressRef.current;
      pressRef.current = undefined;
      wasDraggedRef.current = press?.dragging === true;
      if (press?.dragging) {
        setDrag(undefined);
        onDropRef.current(
          press.item,
          findDropTarget(event.clientX, event.clientY)
        );
      }
    }

    function handlePointerCancel() {
      pressRef.current = undefined;
      setDrag(undefined);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, []);

  function getDragSourceProps(item: CS2InventoryItem) {
    return {
      onPointerDown(event: ReactPointerEvent) {
        if (event.button === 0) {
          wasDraggedRef.current = false;
          pressRef.current = {
            dragging: false,
            item,
            x: event.clientX,
            y: event.clientY
          };
        }
      },
      onClickCapture(event: ReactMouseEvent) {
        if (wasDraggedRef.current) {
          event.stopPropagation();
        }
      }
    };
  }

  function setGhost(element: HTMLElement | null) {
    ghostRef.current = element;
    moveGhost();
  }

  return { drag, getDragSourceProps, setGhost };
}
