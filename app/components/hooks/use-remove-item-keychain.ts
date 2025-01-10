/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {useState} from "react";

export function useRemoveItemKeychain() {
    const [removeItemKeychain, setRemoveItemKeychain] = useState<{
        uid: number;
    }>();

    function handleRemoveItemKeychain(uid: number) {
        return setRemoveItemKeychain({uid});
    }

    function closeRemoveItemKeychain() {
        return setRemoveItemKeychain(undefined);
    }

    function isRemovingItemKeychain(
        state: typeof removeItemKeychain
    ): state is NonNullable<typeof removeItemKeychain> {
        return state !== undefined;
    }

    return {
        closeRemoveItemKeychain,
        handleRemoveItemKeychain,
        isRemovingItemKeychain,
        removeItemKeychain
    };
}
