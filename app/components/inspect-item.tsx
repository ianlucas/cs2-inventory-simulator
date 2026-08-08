/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FloatingFocusManager } from "@floating-ui/react";
import { faCheck, faShare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2Economy,
  CS2EconomyItem,
  CS2InventoryItem,
  CS2_MIN_SEED
} from "@ianlucas/cs2-lib";
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
import { useKeyRelease } from "./hooks/use-key-release";
import { useTimedState } from "./hooks/use-timed-state";
import { useViewer } from "./hooks/use-viewer";
import { useViewerAvailability } from "./hooks/use-viewer-availability";
import { useViewerStatus } from "./hooks/use-viewer-status";
import { InGameOverlay } from "./in-game-overlay";
import { InfoIcon } from "./info-icon";
import { InspectCharmDetachments } from "./inspect-charm-detachments";
import { ItemDescription } from "./item-description";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { UseItemFooter } from "./use-item-footer";
import { ViewerOverlay } from "./viewer-overlay";

interface InspectItemProps {
  onClose: () => void;
  onUnsealGraffiti?: (uid: number) => void;
  uid: number;
}

export function InspectItemHeader({
  icon,
  item,
  subtitle,
  title
}: {
  icon?: ReactNode;
  item: CS2EconomyItem | CS2InventoryItem;
  subtitle?: ReactNode;
  title?: ReactNode;
}) {
  const nameItemString = useNameItemString();
  icon ??=
    item.collectionKey !== undefined ? (
      <ItemImage className="w-29.5" item={item} type="collection" />
    ) : undefined;
  subtitle ??= item.collectionName;
  return (
    <div className="flex flex-col items-center">
      <div className="flex w-fit flex-col">
        <div className="flex items-center justify-center gap-1 px-4">
          {icon}
          <div
            className={clsx(
              "max-w-200",
              icon !== undefined ? "text-left" : "text-center"
            )}
          >
            <div className="font-display text-[36px] leading-tight font-medium text-white/90">
              {title ?? nameItemString(item)}
            </div>
            {subtitle !== undefined && (
              <div className="mt-1 font-sans text-[20px] text-neutral-300 drop-shadow">
                {subtitle}
              </div>
            )}
          </div>
        </div>
        <div
          className="mt-1.5 h-1 w-full"
          style={{
            backgroundImage: `linear-gradient(to right, ${item.rarityColor}, color-mix(in srgb, ${item.rarityColor} 72%, #000))`
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
              {item.variantIndex}
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

function InspectItemDescription({ item }: { item: CS2InventoryItem }) {
  const translate = useTranslate();
  const isGraffitiWithCharges = item.isGraffiti() && item.hasCharges();
  const isSealedGraffiti = isGraffitiWithCharges && item.isSealed();
  const isUnsealedGraffiti = isGraffitiWithCharges && !item.isSealed();
  if (
    !isGraffitiWithCharges &&
    (item.parent ?? item).description === undefined &&
    item.description === undefined
  ) {
    return null;
  }
  return (
    <div className="scrollbar-transparent m-auto max-h-48 max-w-5xl overflow-y-auto px-24 pb-4 lg:w-5xl">
      {isSealedGraffiti ? (
        <p className="mt-4 whitespace-pre-wrap text-neutral-300">
          {translate("ItemSealedGraffitiDesc")}
        </p>
      ) : isUnsealedGraffiti ? (
        <>
          <ItemDescription item={item} />
          <p className="mt-4 text-cyan-200/80">
            {translate(
              "ItemGraffitiChargesRemaining",
              String(item.getCharges())
            )}
          </p>
        </>
      ) : (
        <ItemDescription item={item} />
      )}
    </div>
  );
}

function InspectItemUnsealButton({
  item,
  onClick
}: {
  item: CS2InventoryItem;
  onClick?: () => void;
}) {
  const translate = useTranslate();
  if (!item.isGraffiti() || !item.isSealed() || onClick === undefined) {
    return null;
  }
  return (
    <ModalButton
      variant="secondary"
      onClick={onClick}
      children={translate("InventoryItemUnsealGraffiti")}
    />
  );
}

function InspectItem3d({ onClose, onUnsealGraffiti, uid }: InspectItemProps) {
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
        <InspectItemDescription item={item} />
        <UseItemFooter
          left={
            <>
              {infoButton}
              <InspectItemShareButton item={item} />
            </>
          }
          right={
            <>
              <InspectItemUnsealButton
                item={item}
                onClick={
                  onUnsealGraffiti !== undefined
                    ? () => {
                        onClose();
                        onUnsealGraffiti(uid);
                      }
                    : undefined
                }
              />
              <ModalButton
                variant="secondary"
                onClick={onClose}
                children={translate("InspectClose")}
              />
            </>
          }
        />
      </div>
      {infoTooltip}
    </ViewerOverlay>
  );
}

function InspectItem2d({ onClose, onUnsealGraffiti, uid }: InspectItemProps) {
  const translate = useTranslate();
  const item = useInventoryItem(uid);
  const { statsForNerds } = usePreferences();
  const { infoButton, infoTooltip } = useInspectInfo(item);

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <InGameOverlay header={<InspectItemHeader item={item} />}>
            <div className="flex size-full items-center justify-center">
              <div className="relative inline-block">
                <ItemImage className="w-lg" item={item} />
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
            <div className="absolute bottom-8 left-0 w-full">
              <InspectItemDescription item={item} />
              <UseItemFooter
                className="mt-2 max-w-5xl px-8 lg:w-5xl"
                left={
                  <>
                    {infoButton}
                    <InspectItemShareButton item={item} />
                  </>
                }
                right={
                  <>
                    <InspectItemUnsealButton
                      item={item}
                      onClick={
                        onUnsealGraffiti !== undefined
                          ? () => {
                              onClose();
                              onUnsealGraffiti(uid);
                            }
                          : undefined
                      }
                    />
                    <ModalButton
                      variant="secondary"
                      onClick={onClose}
                      children={translate("InspectClose")}
                    />
                  </>
                }
              />
            </div>
            {infoTooltip}
          </InGameOverlay>,
          document.body
        )
      }
    />
  );
}

export function InspectItem({
  onClose,
  onUnsealGraffiti,
  uid
}: InspectItemProps) {
  const item = useInventoryItem(uid);
  const { canUse3d } = useViewerAvailability(item);

  useKeyRelease("Escape", onClose);

  useEffect(() => {
    clientGlobals.inspectedItem = item;
    return () => {
      clientGlobals.inspectedItem = undefined;
    };
  }, []);

  if (item.isCharmDetachment()) {
    return <InspectCharmDetachments onClose={onClose} uid={uid} />;
  }
  return canUse3d ? (
    <InspectItem3d
      onClose={onClose}
      onUnsealGraffiti={onUnsealGraffiti}
      uid={uid}
    />
  ) : (
    <InspectItem2d
      onClose={onClose}
      onUnsealGraffiti={onUnsealGraffiti}
      uid={uid}
    />
  );
}
