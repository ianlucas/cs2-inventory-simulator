/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  size,
  useDismiss,
  useFloating,
  useInteractions,
  useListNavigation,
  useMergeRefs,
  useRole
} from "@floating-ui/react";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import { ChangeEvent, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getSoundProps } from "~/interface-sounds";
import { ItemImage } from "./item-image";
import { Marquee } from "./marquee";

const MIN_OPTIONS_WIDTH = 256;
const OPTION_HEIGHT_ESTIMATE = 44;
const OPTIONS_OVERSCAN = 6;

export interface ItemComboboxOption {
  description?: string;
  id: number;
  image?: CS2EconomyItem;
  label: string;
}

export function filterItemComboboxOptions(
  options: ItemComboboxOption[],
  query: string
) {
  const words = query
    .toLowerCase()
    .split(" ")
    .filter((word) => word.length > 0);
  return options.filter((option) => {
    const text = `${option.label} ${option.description ?? ""}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
}

export function ItemCombobox({
  disabled,
  onChange,
  options,
  placeholder,
  value
}: {
  disabled?: boolean;
  onChange: (id: number) => void;
  options: ItemComboboxOption[];
  placeholder?: string;
  value: number | undefined;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const listRef = useRef<(HTMLElement | null)[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.id === value);
  const filtered = useMemo(
    () => filterItemComboboxOptions(options, query),
    [options, query]
  );
  const virtualizer = useVirtualizer({
    count: filtered.length,
    estimateSize: () => OPTION_HEIGHT_ESTIMATE,
    getItemKey: (index) => filtered[index].id,
    getScrollElement: () => scrollRef.current,
    overscan: OPTIONS_OVERSCAN
  });

  useLayoutEffect(() => {
    listRef.current.length = filtered.length;
  }, [filtered.length]);

  const { refs, floatingStyles, context } = useFloating<HTMLInputElement>({
    middleware: [
      offset(2),
      flip({ padding: 8 }),
      size({
        apply({ availableHeight, elements, rects }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${Math.min(availableHeight, 256)}px`,
            width: `${Math.max(rects.reference.width, MIN_OPTIONS_WIDTH)}px`
          });
        },
        padding: 8
      })
    ],
    onOpenChange: handleOpenChange,
    open: isOpen,
    placement: "bottom-start",
    whileElementsMounted: autoUpdate
  });
  const role = useRole(context, { role: "listbox" });
  const dismiss = useDismiss(context);
  const listNavigation = useListNavigation(context, {
    activeIndex,
    disabledIndices: [],
    listRef,
    loop: true,
    onNavigate(index) {
      setActiveIndex(index);
      if (index !== null) {
        virtualizer.scrollToIndex(index);
      }
    },
    scrollItemIntoView: false,
    virtual: true
  });
  const { getFloatingProps, getItemProps, getReferenceProps } = useInteractions(
    [role, dismiss, listNavigation]
  );
  const floatingRef = useMergeRefs([refs.setFloating, scrollRef]);

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) {
      setQuery("");
      setActiveIndex(null);
    }
  }

  function handleSelect(option: ItemComboboxOption) {
    onChange(option.id);
    handleOpenChange(false);
    refs.domReference.current?.blur();
  }

  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-1 bg-neutral-950/40 focus-within:ring-2 focus-within:ring-blue-500/50"
      ref={refs.setPositionReference}
    >
      {selected?.image !== undefined && !isOpen && (
        <ItemImage className="h-6 shrink-0 pl-1" item={selected.image} />
      )}
      <div className="relative flex min-w-0 flex-1 items-center">
        <input
          {...getReferenceProps({
            onChange(event: ChangeEvent<HTMLInputElement>) {
              setQuery(event.target.value);
              setActiveIndex(0);
              setIsOpen(true);
              virtualizer.scrollToOffset(0);
            },
            onFocus() {
              handleOpenChange(true);
            },
            onKeyDown(event) {
              const option =
                activeIndex !== null ? filtered[activeIndex] : undefined;
              if (event.key === "Enter" && option !== undefined) {
                event.preventDefault();
                handleSelect(option);
              }
            }
          })}
          aria-autocomplete="list"
          className="w-0 min-w-0 flex-1 bg-transparent px-2 py-1 placeholder-neutral-500 outline-hidden"
          disabled={disabled}
          placeholder={
            isOpen
              ? (selected?.label ?? placeholder)
              : selected === undefined
                ? placeholder
                : undefined
          }
          ref={refs.setReference}
          value={isOpen ? query : ""}
        />
        {!isOpen && selected !== undefined && (
          <div className="pointer-events-none absolute inset-0 flex items-center px-2">
            <Marquee>{selected.label}</Marquee>
          </div>
        )}
      </div>
      {!disabled && (
        <FontAwesomeIcon
          className="h-4 shrink-0 pr-2 text-neutral-400"
          icon={faCaretDown}
        />
      )}
      {isOpen && filtered.length > 0 && (
        <FloatingPortal>
          <div
            {...getFloatingProps()}
            className="z-60 overflow-y-auto rounded-b bg-neutral-800 text-sm text-white shadow-lg select-none"
            ref={floatingRef}
            style={floatingStyles}
          >
            <div
              className="relative"
              style={{ height: virtualizer.getTotalSize() }}
            >
              {virtualizer.getVirtualItems().map(({ index, key, start }) => {
                const option = filtered[index];
                return (
                  <div
                    {...getItemProps({
                      onClick() {
                        handleSelect(option);
                      },
                      ...getSoundProps({
                        hover: "submenu_dropdown_option_rollover",
                        press: "submenu_dropdown_option_select"
                      })
                    })}
                    aria-selected={option.id === value}
                    className={clsx(
                      "absolute top-0 left-0 flex w-full cursor-default items-center gap-2 px-2 py-1",
                      activeIndex === index
                        ? "bg-blue-600"
                        : option.id === value && "bg-neutral-600/50"
                    )}
                    data-index={index}
                    key={key}
                    ref={(node) => {
                      listRef.current[index] = node;
                      virtualizer.measureElement(node);
                    }}
                    role="option"
                    style={{ transform: `translateY(${start}px)` }}
                  >
                    {option.image !== undefined && (
                      <ItemImage
                        className="h-8 shrink-0"
                        item={option.image}
                        lazy
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <Marquee>{option.label}</Marquee>
                      {option.description !== undefined && (
                        <Marquee className="text-xs text-neutral-400">
                          {option.description}
                        </Marquee>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}
