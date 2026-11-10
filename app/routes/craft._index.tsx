/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faArrowLeft, faLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS2BaseInventoryItem, CS2EconomyItem } from "@ianlucas/cs2-lib";
import { useState } from "react";
import { data, redirect, useLoaderData, useNavigate } from "react-router";
import { z } from "zod";
import {
  useInventory,
  useRules,
  useTranslate,
  useUser
} from "~/components/app-context";
import { CraftEdit } from "~/components/craft-edit";
import { CraftImportInspectLink } from "~/components/craft-import-inspect-link";
import { CraftNew } from "~/components/craft-new";
import { CraftShareUser } from "~/components/craft-share-user";
import { CraftView } from "~/components/craft-view";
import {
  CraftMorphLayers,
  CraftMorphTitles,
  useCraftMorph
} from "~/components/craft-morph";
import { useIsDesktop } from "~/components/hooks/use-is-desktop";
import { useLockScroll } from "~/components/hooks/use-lock-scroll";
import { useSync } from "~/components/hooks/use-sync";
import { ItemEditorAttributes } from "~/components/item-editor";
import { ItemPicker } from "~/components/item-picker";
import { Modal, ModalHeader } from "~/components/modal";
import { SyncAction } from "~/data/sync";
import { middleware } from "~/middleware.server";
import { inventoryAllowProfile } from "~/models/rule.server";
import { getUserBasicData } from "~/models/user.server";
import { getMetaTitle } from "~/root-meta";
import { isItemCountable } from "~/shared/economy";
import {
  createFakeInventoryItemFromBase,
  editInventoryItem,
  parseInventoryItemShare
} from "~/shared/inventory";
import { tryOrDefault } from "~/shared/misc";
import { range } from "~/shared/number";
import { playSound } from "~/sound.client";
import type { Route } from "./+types/craft._index";

export const meta = getMetaTitle("HeaderCraftLabel");

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);
  const url = new URL(request.url);
  const share = url.searchParams.get("share");
  const shared = share !== null ? parseInventoryItemShare(share) : undefined;
  if (share !== null && shared === undefined) {
    throw redirect("/craft?error=InvalidShareLink");
  }
  return data({
    shared:
      shared !== undefined
        ? {
            item: shared.item,
            user:
              shared.userId !== undefined
                ? await getUserBasicData(shared.userId)
                : undefined,
            userHasProfile:
              shared.userId !== undefined &&
              (await inventoryAllowProfile.for(shared.userId).get())
          }
        : undefined,
    uid: z
      .string()
      .optional()
      .transform((uid) => (uid !== undefined ? Number(uid) : uid))
      .parse(url.searchParams.get("uid") || undefined)
  });
}

export default function Craft() {
  const { uid, shared } = useLoaderData<typeof loader>();

  const isEditing = uid !== undefined;
  const isSharing = shared?.item !== undefined;
  const isCrafting = !isEditing && !isSharing;

  const translate = useTranslate();
  const sync = useSync();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const user = useUser();

  const { craftAllowImportInspectLink } = useRules();
  const [inventory, setInventory] = useInventory();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImportFromInspectLink, setIsImportFromInspectLink] = useState(false);
  const [item, setItem] = useState<CS2EconomyItem | undefined>(
    isEditing
      ? tryOrDefault(() => inventory.get(uid))
      : isSharing
        ? createFakeInventoryItemFromBase(shared.item)
        : undefined
  );

  const morph = useCraftMorph({ onClosed: () => setItem(undefined) });

  useLockScroll();

  function handleSubmit({ quantity, ...attributes }: ItemEditorAttributes) {
    if (isSubmitting || item === undefined) {
      return;
    }

    playSound("inventory_new_item_accept");
    setIsSubmitting(true);

    if (isEditing) {
      setInventory(editInventoryItem(inventory, uid, attributes));
      sync({
        type: SyncAction.Edit,
        uid,
        attributes
      });
      return navigate("/", { preventScrollReset: true });
    }

    const inventoryItem = {
      ...attributes,
      id: item.id,
      souvenir: attributes.souvenir ? (true as const) : undefined,
      statTrak: attributes.statTrak ? (0 as const) : undefined
    } satisfies CS2BaseInventoryItem;

    range(isItemCountable(item) ? quantity : 1).forEach(() => {
      setInventory(inventory.add(inventoryItem));
      sync({
        type: SyncAction.Add,
        item: inventoryItem
      });
    });
    return navigate("/", { preventScrollReset: true });
  }

  function handleClose() {
    return navigate("/", { preventScrollReset: true });
  }

  function pickItem(item: CS2EconomyItem, image?: HTMLElement | null) {
    if (morph.open(image)) {
      setItem(item);
    }
  }

  function handleImportFromInspectLinkOpen() {
    setIsImportFromInspectLink(true);
  }

  function handleImportFromInspectLinkClose() {
    setIsImportFromInspectLink(false);
  }

  function handleInspectLinkImport(item: CS2BaseInventoryItem) {
    setIsImportFromInspectLink(false);
    pickItem(createFakeInventoryItemFromBase(item));
  }

  const editorProps =
    item !== undefined
      ? {
          item,
          onSubmit: handleSubmit,
          onClose: handleClose
        }
      : undefined;
  const hasItem = editorProps !== undefined;

  const CraftComponent = isEditing ? CraftEdit : CraftView;

  return (
    <>
      {isCrafting && (
        <Modal
          className={
            morph.isPicking
              ? isDesktop
                ? "max-w-180 min-w-160"
                : "w-135"
              : "w-fit"
          }
        >
          <ModalHeader
            closeTo="/"
            title={
              <CraftMorphTitles
                editor={
                  <>
                    <button
                      aria-label={translate("CraftBack")}
                      className="-ml-1 flex h-4 cursor-default items-center pr-2.5 pl-1 opacity-50 transition hover:opacity-100"
                      onClick={morph.close}
                      type="button"
                    >
                      <FontAwesomeIcon
                        icon={faArrowLeft}
                        className="size-3.5"
                      />
                    </button>
                    {translate("CraftConfirmHeader")}
                  </>
                }
                morph={morph}
                picker={translate("CraftSelectHeader")}
              />
            }
          />
          <CraftMorphLayers
            editor={
              item !== undefined ? (
                <CraftNew
                  item={item}
                  onClose={morph.close}
                  onSubmit={handleSubmit}
                />
              ) : undefined
            }
            morph={morph}
            picker={
              <ItemPicker
                navItems={[
                  user !== undefined &&
                    craftAllowImportInspectLink && {
                      icon: faLink,
                      isActive: isImportFromInspectLink,
                      label: translate("CraftImportNavLabel"),
                      onClick: handleImportFromInspectLinkOpen
                    }
                ]}
                onPickItem={pickItem}
              />
            }
          />
        </Modal>
      )}
      {!isCrafting && hasItem && (
        <Modal className="w-fit">
          <ModalHeader
            title={translate(
              isSharing ? "CraftSharedHeader" : "CraftConfirmHeader"
            )}
            onClose={handleClose}
          />
          {shared?.user !== undefined && (
            <CraftShareUser
              user={shared.user}
              hasProfile={shared.userHasProfile}
            />
          )}
          <CraftComponent {...editorProps} />
        </Modal>
      )}
      {isImportFromInspectLink && (
        <Modal className="w-105">
          <CraftImportInspectLink
            onImport={handleInspectLinkImport}
            onClose={handleImportFromInspectLinkClose}
          />
        </Modal>
      )}
    </>
  );
}
