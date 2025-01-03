# Rules

CS2 Inventory Simulator can be configured at runtime using rules. These rules can modify various behaviors of the app, such as enabling users to edit items and adding new ones. Each rule that can be altered is stored in the Rule table.

> [!TIP]  
> You can find all possible items and their attributes [here](https://raw.githubusercontent.com/ianlucas/cslib/main/assets/data/items.json).

## Current rules

### `appName`

- Name of the app. If empty, uses Inventory Simulator's default value.
- **Type:** `string`
- **Default:** _Empty_

### `appFooterName`

- Name in the footer of the app. If empty, uses Inventory Simulator's default value.
- **Type:** `string`
- **Default:** _Empty_

### `appLogoUrl`

- URL of the app's logo. If empty, uses Inventory Simulator's logo. Server must be restarted if changed.
- **Type:** `string`
- **Default:** _Empty_

### `appFaviconUrl`

- URL of the app's favicon. If empty, uses Inventory Simulator's favicon.
- **Type:** `string`
- **Default:** _Empty_

### `appFaviconMimeType`

- MIME type of the app's favicon. If empty, uses Inventory Simulator's favicon MIME type.
- **Type:** `string`
- **Default:** _Empty_

### `appSeoDescription`

- SEO description for the app. If empty, uses Inventory Simulator's default value.
- **Type:** `string`
- **Default:** _Empty_

### `appSeoImageUrl`

- SEO image for the app. If empty, uses Inventory Simulator's default value.
- **Type:** `string`
- **Default:** _Empty_

### `appSeoTitle`

- SEO title for the app. If empty, uses Inventory Simulator's default value.
- **Type:** `string`
- **Default:** _Empty_

### `appCountry`

- Country of the application (ISO-3166-1 alpha-2 code). This will change the language of the application if it's available for the respective country (e.g. `br` uses `brazilian` translation).
- **Type:** `string`
- **Default:** `us`

### `steamApiKey`

- Steam API Key is used to retrieve user information from Steam.
- **Type:** `string`
- **Default:** Either environment variable `STEAM_API_KEY` or `YOUR_STEAM_API_KEY_GOES_HERE`.

### `steamCallbackUrl`

- This URL is called to validate the user's authentication on Steam.
- **Type:** `string`
- **Expected value:** `https://your.domain/sign-in/steam/callback`
- **Default:** Either environment variable `STEAM_CALLBACK_URL` or `http://localhost/sign-in/steam/callback`.

> [!CAUTION]  
> Both `steamApiKey` and `steamCallbackUrl` are required for authentication to work.

### `appCacheInventory`

- Indicates whether the app will cache the user's inventory if they're offline or unauthenticated.
- **Type:** `boolean`
- **Default:** `true`

### `inventoryMaxItems`

- The maximum number of items a user can add to the inventory.
- **Type:** `number`
- **Default:** `256`

### `inventoryStorageUnitMaxItems`

- The maximum number of items a storage unit can store.
- **Type:** `number`
- **Default:** `32`

### `inventoryItemAllowEdit`

- Indicates whether the user can edit an inventory item.
- **Type:** `boolean`
- **Default:** `false`

### `inventoryItemAllowApplySticker`

- Indicates whether the user can apply sticker to an inventory item.
- **Type:** `boolean`
- **Default:** `true`

### `inventoryItemAllowScrapeSticker`

- Indicates whether the user can scrape sticker in an inventory item.
- **Type:** `boolean`
- **Default:** `true`

### `inventoryItemAllowApplyPatch`

- Indicates whether the user can apply patch to an inventory item.
- **Type:** `boolean`
- **Default:** `true`

### `inventoryItemAllowRemovePatch`

- Indicates whether the user can remove patch in an inventory item.
- **Type:** `boolean`
- **Default:** `true`

### `inventoryItemAllowUnlockContainer`

- Indicates whether the user can unlock a container inventory item.
- **Type:** `boolean`
- **Default:** `true`

### `inventoryItemAllowInspectInGame`

- Indicates whether the user can inspect an item in-game.
- **Type:** `boolean`
- **Default:** `true`

### `inventoryItemAllowShare`

- Indicates whether the user can share an inventory item.

### `inventoryItemEquipHideModel`

- Determines whether to disallow an item model from being equipped by the user.
- **Type:** `string-array`
- **Usage example:** `knife_flip;bayonet` (Users won't be able to equip flip and bayonet knives.)

### `inventoryItemEquipHideType`

- Determines whether to disallow an item type from being equipped by the user.
- **Type:** `string-array`
- **Usage example:** `agent;weapon` (Users won't be able to equip agent and weapon items.)

### `craftHideCategory`

- Determines whether to hide a category when crafting an item. This also prevents the item from being added by the user.
- **Type:** `string-array`
- **Usage example:** `secondary;rifle` (Users won't be able to craft secondary and rifle items.)

### `craftHideType`

- Determines whether to hide a type when crafting an item. This also prevents the item from being added by the user.
- **Type:** `string-array`
- **Usage example:** `agent;case` (Users won't be able to craft agent and case items.)

### `craftHideFilterType`

- Determines whether to hide a type from the "crafting an item..." prompt. This will NOT prevent the item from being added by the user when crafting/editing a weapon that may have stickers applied (unless enforced).
- **Type:** `string-array`
- **Usage example:** `sticker` (Users won't be able to see the "Sticker" item type when crafting an item)

### `craftHideModel`

- Determines whether to hide a model when crafting an item. This also prevents the item from being added by the user.
- **Type:** `string-array`
- **Usage example:** `knife_flip;bayonet` (Users won't be able to craft flip and bayonet knives.)

### `craftHideId`

- Determines whether to hide an item when crafting. This also prevents the item from being added by the user.
- **Type:** `number-array`
- **Usage example:** `307` (Users won't be able to craft AWP | Dragon Lore.)

### `craftAllowNametag`

- Indicates whether the user can define Name tag when crafting.
- **Type:** `boolean`
- **Default:** `true`

### `craftAllowSeed`

- Indicates whether the user can define Seed when crafting.
- **Type:** `boolean`
- **Default:** `true`

### `craftAllowStatTrak`

- Indicates whether the user can define StatTrak when crafting.
- **Type:** `boolean`
- **Default:** `true`

### `craftAllowStickers`

- Indicates whether the user can define Stickers when crafting.
- **Type:** `boolean`
- **Default:** `true`

### `craftAllowPatches`

- Indicates whether the user can define Patches when crafting.
- **Type:** `boolean`
- **Default:** `true`

### `craftAllowWear`

- Indicates whether the user can define Wear when crafting.
- **Type:** `boolean`
- **Default:** `true`

### `craftMaxQuantity`

- The maximum quantity an item can be crafted. There is no limit if the value is `0`.
- **Type:** `number`
- **Default:** `0`

### `editHideCategory`

- Determines whether to hide a category from being editable.
- **Type:** `string-array`
- **Usage example:** `secondary;rifle` (Users won't be able to edit secondary and rifle items.)

### `editHideType`

- Determines whether to hide a type from being editable.
- **Type:** `string-array`
- **Usage example:** `sticker;weapon` (Users won't be able to edit sticker and weapon items.)

### `editHideModel`

- Determines whether to hide a model from being editable.
- **Type:** `string-array`
- **Usage example:** `knife_flip;bayonet` (Users won't be able to edit flip and bayonet knives.)

### `editHideId`

- Determines whether to hide an item from being editable.
- **Type:** `number-array`
- **Usage example:** `307` (Users won't be able to edit AWP | Dragon Lore.)

### `editAllowNametag`

- Indicates whether the user can define Name tag when editing.
- **Type:** `boolean`
- **Default:** `true`

### `editAllowSeed`

- Indicates whether the user can define Seed when editing.
- **Type:** `boolean`
- **Default:** `true`

### `editAllowStatTrak`

- Indicates whether the user can define StatTrak when editing.
- **Type:** `boolean`
- **Default:** `true`

### `editAllowStickers`

- Indicates whether the user can define Stickers when editing.
- **Type:** `boolean`
- **Default:** `true`

### `editAllowPatches`

- Indicates whether the user can define Patches when editing.
- **Type:** `boolean`
- **Default:** `true`

### `editAllowWear`

- Indicates whether the user can define Wear when editing.
- **Type:** `boolean`
- **Default:** `true`

## Rule overwriting

There are two ways to overwrite rules: by adding records to `GroupRole` and `UserRule` tables. Users can be grouped by creating a record on `Group` table, and then associating each user to a group on `UserGroup`.

1. If the system finds a rule for a user in `UserRule`, that rule will be enforced.
2. If the system finds a rule for a group the user is in, on `GroupRule` table, that rule will enforced. If the user is associated to multiple groups, the rule for the group with the higher `priority` will be enforced.

> [!TIP]  
> For example, consider `admin` and `vip` groups - if a user is associated to both, you'd make sure `admin`'s `priority` is higher than `vip`'s.
