import { autoUpdate, flip, FloatingFocusManager, offset, shift, useClick, useDismiss, useFloating, useInteractions, useRole } from "@floating-ui/react";
import { faCircleDot } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { CS_Economy } from "cslib";
import { useState } from "react";
import { useAnyClick } from "~/hooks/floating-ui";
import { transform } from "~/utils/inventory";

export function InventoryItem(
  { csItem, inventoryItem, index, name, model, equipped }: ReturnType<
    typeof transform
  >
) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(10), flip(), shift()],
    whileElementsMounted: autoUpdate
  });

  const click = useAnyClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role
  ]);

  return (
    <>
      <div
        className="hover:drop-shadow-[0_0_5px_rgba(0,0,0,1)] transition-all"
        {...getReferenceProps()}
      >
        <div className="p-[1px] bg-gradient-to-b from-neutral-600 to-neutral-400 relative">
          <div className="bg-gradient-to-b from-neutral-500 to-neutral-300 px-1">
            <img
              className="w-[144px] h-[108px]"
              src={CS_Economy.resolveImageSrc(
                "/localimage",
                inventoryItem.id,
                inventoryItem.float
              )}
              draggable={false}
            />
          </div>
          <div className="absolute right-0 top-0 p-2 flex items-center gap-1">
            {equipped.map((color, colorIndex) => (typeof color === "string"
              ? (
                <FontAwesomeIcon
                  key={colorIndex}
                  className={clsx("h-3.5 text-sky-300", color)}
                  icon={faCircleDot}
                />
              )
              : null)
            )}
          </div>
        </div>
        <div
          className="shadow shadow-black/50 w-full h-1"
          style={{ backgroundColor: csItem.rarity }}
        />
        <div className="text-[12px] leading-3 mt-2 text-white drop-shadow-[0_0_1px_rgba(0,0,0,1)]">
          <div className="font-bold">{model}</div>
          <div>{name}</div>
        </div>
      </div>
      {isOpen && (
        <FloatingFocusManager context={context} modal={false}>
          <div
            className="bg-neutral-800 text-white"
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            Popover element
          </div>
        </FloatingFocusManager>
      )}
    </>
  );
}
