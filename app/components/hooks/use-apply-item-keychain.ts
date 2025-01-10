/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {assert} from "@driscode/cs2-lib";
import {useState} from "react";
import {useInventory, useInventoryItems} from "~/components/app-context";
import {useItemSelector} from "~/components/item-selector-context";

export function useApplyItemKeychain() {
    const items = useInventoryItems();
    const [inventory] = useInventory();
    const [itemSelector, setItemSelector] = useItemSelector();
    const [applyItemKeychain, setApplyItemKeychain] = useState<{
        targetUid: number;
        keychainUid: number;
    }>();

    function handleApplyItemKeychain(uid: number) {
        const selectedItem = inventory.get(uid);
        return setItemSelector({
            uid,
            items: items.filter(({item}) =>
                selectedItem.isKeychain()
                    ? item.hasKeychain() && item.keychain === undefined
                    : item.isKeychain()
            ),
            type: "apply-item-keychain"
        });
    }

    function handleApplyItemKeychainSelect(uid: number) {
        assert(itemSelector !== undefined);
        const isKeychain = inventory.get(uid).isKeychain();
        return setApplyItemKeychain({
            targetUid: !isKeychain ? uid : itemSelector.uid,
            keychainUid: isKeychain ? uid : itemSelector.uid
        });
    }

    function closeApplyItemKeychain() {
        return setApplyItemKeychain(undefined);
    }

    function isApplyingItemKeychain(
        state: typeof applyItemKeychain
    ): state is NonNullable<typeof applyItemKeychain> {
        return state !== undefined;
    }

    return {
        applyItemKeychain,
        closeApplyItemKeychain,
        handleApplyItemKeychain,
        handleApplyItemKeychainSelect,
        isApplyingItemKeychain
    };
}
