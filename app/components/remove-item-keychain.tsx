/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {CS2Economy} from "@driscode/cs2-lib";
import {useState} from "react";
import {createPortal} from "react-dom";
import {ClientOnly} from "remix-utils/client-only";
import {useNameItemString} from "~/components/hooks/use-name-item";
import {useSync} from "~/components/hooks/use-sync";
import {SyncAction} from "~/data/sync";
import {playSound} from "~/utils/sound";
import {useInventory, useLocalize} from "./app-context";
import {ItemImage} from "./item-image";
import {Modal} from "./modal";
import {ModalButton} from "./modal-button";
import {UseItemFooter} from "./use-item-footer";
import {UseItemHeader} from "./use-item-header";

export function RemoveItemKeychain({
                                       onClose,
                                       uid
                                   }: {
    onClose: () => void;
    uid: number;
}) {
    const nameItemString = useNameItemString();
    const localize = useLocalize();
    const sync = useSync();

    const [inventory, setInventory] = useInventory();
    const [confirmRemove, setConfirmRemove] = useState<boolean>(false);

    const item = inventory.get(uid);

    function doRemoveKeychain() {
        sync({
            type: SyncAction.RemoveItemKeychain,
            targetUid: uid
        });
        setInventory(inventory.removeItemKeychain(uid));
        playSound("inventory_new_item_accept");
        onClose();
    }

    function handleConfirmScrape() {
        doRemoveKeychain();
        setConfirmRemove(false);
    }

    return (
        <ClientOnly
            children={() =>
                createPortal(
                    <>
                        <div
                            className="fixed left-0 top-0 z-50 flex h-full w-full select-none items-center justify-center bg-black/60 backdrop-blur-sm">
                            <div>
                                <UseItemHeader
                                    title={localize("RemoveKeychainUse")}
                                    warning={localize("RemoveKeychainWarn")}
                                    warningItem={nameItemString(item)}
                                />
                                <ItemImage
                                    className="m-auto aspect-[1.33333] max-w-[512px]"
                                    item={item}
                                />
                                <div className="flex justify-center">
                                    <button className="group">
                                        {item.keychain !== undefined &&
                                            (
                                                <ItemImage
                                                    className="h-[126px] w-[168px] scale-90 drop-shadow-lg transition-all group-hover:scale-100 group-active:scale-125"
                                                    item={CS2Economy.getById(item?.keychain?.id)}
                                                />
                                            )
                                        }
                                    </button>
                                </div>
                                <UseItemFooter
                                    right={
                                        <>
                                            <ModalButton
                                                children={localize("RemoveKeychainRemove")}
                                                onClick={() => setConfirmRemove(true)}
                                                variant="primary"
                                            />
                                            <ModalButton
                                                children={localize("ScrapeStickerClose")}
                                                onClick={onClose}
                                                variant="secondary"
                                            />
                                        </>
                                    }

                                />
                            </div>
                        </div>
                        {confirmRemove && (
                            <Modal fixed>
                                <div className="px-4 py-2 text-sm font-bold">
                  <span className="text-neutral-400">
                    {localize("RemoveKeychainRemove")}
                  </span>
                                </div>
                                <p className="px-4">{localize("RemoveKeychainRemoveDesc")}</p>
                                <div className="flex justify-end px-4 py-2">
                                    <ModalButton
                                        onClick={handleConfirmScrape}
                                        variant="secondary"
                                        children={localize("RemoveKeychainRemove")}
                                    />
                                    <ModalButton
                                        onClick={() => setConfirmRemove(false)}
                                        variant="secondary"
                                        children={localize("ScrapeStickerCancel")}
                                    />
                                </div>
                            </Modal>
                        )}
                    </>,
                    document.body
                )
            }
        />
    );
}
