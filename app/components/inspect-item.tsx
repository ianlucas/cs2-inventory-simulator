/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FloatingFocusManager } from "@floating-ui/react";
import { faCheck, faShare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS2Economy, CS2InventoryItem, CS2_MIN_SEED } from "@ianlucas/cs2-lib";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import clsx from "clsx";
import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useInspectFloating } from "~/components/hooks/use-inspect-floating";
import { useInventoryItem } from "~/components/hooks/use-inventory-item";
import { useNameItemString } from "~/components/hooks/use-name-item";
import { clientGlobals } from "~/globals";
import { wearToString } from "~/utils/economy";
import { getInventoryItemShareUrl } from "~/utils/inventory";
import { usePreferences, useTranslate, useUser } from "./app-context";
import { useTimedState } from "./hooks/use-timed-state";
import { useViewer } from "./hooks/use-viewer";
import { useViewerAvailability } from "./hooks/use-viewer-availability";
import { useViewerStatus } from "./hooks/use-viewer-status";
import { InfoIcon } from "./info-icon";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { Overlay } from "./overlay";
import { UseItemFooter } from "./use-item-footer";
import { ViewerOverlay } from "./viewer-overlay";

interface InspectItemProps {
  onClose: () => void;
  uid: number;
}

function InspectItemHeader({ item }: { item: CS2InventoryItem }) {
  const nameItemString = useNameItemString();
  return (
    <div className="flex flex-col items-center">
      <div className="flex w-fit flex-col">
        <div className="flex items-center justify-center gap-1">
          {item.collection !== undefined && (
            <ItemImage className="w-29.5" item={item} type="collection" />
          )}
          <div
            className={clsx(
              "max-w-200",
              item.collection !== undefined ? "text-left" : "text-center"
            )}
          >
            <div className="font-display text-[36px] leading-tight font-medium text-white/90">
              {nameItemString(item)}
            </div>
            {item.collectionName !== undefined && (
              <div className="mt-1 font-sans text-[20px] text-neutral-300 drop-shadow">
                {item.collectionName}
              </div>
            )}
          </div>
        </div>
        <div
          className="mt-1.5 h-1 w-full"
          style={{
            backgroundImage: `linear-gradient(to right, ${item.rarity}, color-mix(in srgb, ${item.rarity} 72%, #000))`
          }}
        />
      </div>
    </div>
  );
}

function useInspectInfo(item: CS2InventoryItem): {
  infoButton: ReactNode;
  infoTooltip: ReactNode;
} {
  const translate = useTranslate();
  const {
    getHoverFloatingProps,
    getHoverReferenceProps,
    hoverContext,
    hoverRefs,
    hoverStyles,
    isHoverOpen,
    ref
  } = useInspectFloating();
  const hasInfo = item.hasSeed() && item.hasWear();
  return {
    infoButton: hasInfo ? (
      <ModalButton
        variant="secondary"
        forwardRef={ref}
        {...getHoverReferenceProps()}
      >
        <InfoIcon className="h-6" />
      </ModalButton>
    ) : null,
    infoTooltip:
      hasInfo && isHoverOpen ? (
        <FloatingFocusManager context={hoverContext} modal={false}>
          <div
            role="tooltip"
            className="z-20 max-w-[320px] space-y-3 rounded-sm bg-neutral-900/95 px-6 py-4 text-sm text-white outline-hidden"
            ref={hoverRefs.setFloating}
            style={hoverStyles}
            {...getHoverFloatingProps()}
          >
            <div>
              <strong>{translate("InventoryItemInspectFinishCatalog")}:</strong>{" "}
              {item.index}
            </div>
            <div>
              <strong>
                {translate("InventoryItemInspectPatternTemplate")}:
              </strong>{" "}
              {item.seed ?? CS2_MIN_SEED}
            </div>
            <div>
              <strong>{translate("InventoryItemInspectWearRating")}:</strong>{" "}
              {wearToString(item.getWear())}
            </div>
          </div>
        </FloatingFocusManager>
      ) : null
  };
}

function InspectItemShareButton({ item }: { item: CS2InventoryItem }) {
  const [, copyToClipboard] = useCopyToClipboard();
  const user = useUser();
  const [clickedShare, triggerClickedShare] = useTimedState();
  if (!item.isPaintable()) {
    return null;
  }
  function handleClickShare() {
    triggerClickedShare();
    copyToClipboard(getInventoryItemShareUrl(item, user?.id));
  }
  return (
    <ModalButton variant="secondary" onClick={handleClickShare}>
      <FontAwesomeIcon
        icon={clickedShare ? faCheck : faShare}
        className="h-6"
      />
    </ModalButton>
  );
}

function InspectItem3d({ onClose, uid }: InspectItemProps) {
  const translate = useTranslate();
  const item = useInventoryItem(uid);
  const { api, viewerProps } = useViewer({ item });
  useViewerStatus(api);
  const { infoButton, infoTooltip } = useInspectInfo(item);

  return (
    <ViewerOverlay
      header={<InspectItemHeader item={item} />}
      viewerProps={viewerProps}
    >
      <div className="pointer-events-none absolute bottom-8 left-0 w-full">
        <UseItemFooter
          left={
            <>
              {infoButton}
              <InspectItemShareButton item={item} />
            </>
          }
          right={
            <ModalButton
              variant="secondary"
              onClick={onClose}
              children={translate("InspectClose")}
            />
          }
        />
      </div>
      {infoTooltip}
    </ViewerOverlay>
  );
}

function InspectItem2d({ onClose, uid }: InspectItemProps) {
  const translate = useTranslate();
  const item = useInventoryItem(uid);
  const { statsForNerds } = usePreferences();
  const { infoButton, infoTooltip } = useInspectInfo(item);

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <Overlay className="m-auto lg:w-5xl">
            <InspectItemHeader item={item} />
            <div className="text-center">
              <div className="relative mx-auto inline-block">
                <ItemImage className="m-auto my-8 max-w-lg" item={item} />
                {item.stickers !== undefined && (
                  <div className="absolute bottom-0 left-0 flex items-center justify-center">
                    {item.someStickers().map(([index, { id, wear }]) => (
                      <span className="inline-block" key={index}>
                        <ItemImage
                          className="w-32"
                          item={CS2Economy.getById(id)}
                          style={{
                            filter: `grayscale(${wear ?? 0})`,
                            opacity: `${1 - (wear ?? 0)}`
                          }}
                        />
                        {statsForNerds && (
                          <div className="text-sm font-bold text-neutral-300 transition-all group-hover:scale-150">
                            {((wear ?? 0) * 100).toFixed(0)}%
                          </div>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <UseItemFooter
              left={
                <>
                  {infoButton}
                  <InspectItemShareButton item={item} />
                </>
              }
              right={
                <ModalButton
                  variant="secondary"
                  onClick={onClose}
                  children={translate("InspectClose")}
                />
              }
            />
            {infoTooltip}
          </Overlay>,
          document.body
        )
      }
    />
  );
}

export function InspectItem({ onClose, uid }: InspectItemProps) {
  const item = useInventoryItem(uid);
  const { canUse3d } = useViewerAvailability(item);

  useEffect(() => {
    clientGlobals.inspectedItem = item;
    return () => {
      clientGlobals.inspectedItem = undefined;
    };
  }, []);

  return canUse3d ? (
    <InspectItem3d onClose={onClose} uid={uid} />
  ) : (
    <InspectItem2d onClose={onClose} uid={uid} />
  );
}
