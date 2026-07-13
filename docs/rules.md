# Rules

CS2 Inventory Simulator can be configured at runtime using rules. These rules can modify various behaviors of the app, such as enabling users to edit items and adding new ones. Each rule that can be altered is stored in the Rule table.

> [!TIP]  
> You can find all possible items and their attributes [here](https://raw.githubusercontent.com/ianlucas/cs2-lib/refs/heads/main/scripts/data/items.json).

## App

### `appName`

- **Type:** `string`
- **Default:** _empty_

Name of the app. If empty, uses Inventory Simulator's default value.

### `appFooterName`

- **Type:** `string`
- **Default:** _empty_

Name in the footer of the app. If empty, uses Inventory Simulator's default value.

### `appLogoUrl`

- **Type:** `string`
- **Default:** _empty_

URL of the app's logo. If empty, uses Inventory Simulator's logo. Restart required.

### `appFaviconUrl`

- **Type:** `string`
- **Default:** _empty_

URL of the app's favicon. If empty, uses Inventory Simulator's favicon.

### `appFaviconMimeType`

- **Type:** `string`
- **Default:** _empty_

MIME type of the app's favicon. If empty, uses Inventory Simulator's favicon MIME type.

### `appSeoDescription`

- **Type:** `string`
- **Default:** _empty_

SEO description for the app. If empty, uses Inventory Simulator's default value.

### `appSeoImageUrl`

- **Type:** `string`
- **Default:** _empty_

SEO image for the app. If empty, uses Inventory Simulator's default value.

### `appSeoTitle`

- **Type:** `string`
- **Default:** _empty_

SEO title for the app. If empty, uses Inventory Simulator's default value.

### `appCountry`

- **Type:** `string`
- **Default:** `us`

Country of the application (ISO-3166-1 alpha-2 code). Changes language if available.

### `appCacheInventory`

- **Type:** `boolean`
- **Default:** `true`

Cache user's inventory if offline or unauthenticated.

### `appHideLogo`

- **Type:** `boolean`
- **Default:** `false`

Hide the logo in the app.

### `appHideAuth`

- **Type:** `boolean`
- **Default:** `false`

Hide authentication controls in the app.

## Steam

> [!CAUTION]  
> Both `steamApiKey` and `steamCallbackUrl` are required for authentication to work.

### `steamApiKey`

- **Type:** `string`
- **Default:** `STEAM_API_KEY` env var or `YOUR_STEAM_API_KEY_GOES_HERE`

Steam API Key is used to retrieve user information from Steam.

### `steamCallbackUrl`

- **Type:** `string`
- **Default:** `STEAM_CALLBACK_URL` env var or `http://localhost/sign-in/steam/callback`

URL to validate Steam authentication.

## Inventory

### `inventoryMaxItems`

- **Type:** `number`
- **Default:** `256`

Max number of items a user can add to inventory.

### `inventoryStorageUnitMaxItems`

- **Type:** `number`
- **Default:** `32`

Max items a storage unit can store.

### `inventoryInactivityResetDays`

- **Type:** `number`
- **Default:** `0`

Resets (deletes) a user's inventory after this many days without logging into the website or being fetched by the game server. `0` disables the rule. Set a per-user or per-group overwrite to `0` to make them immune.

## Inventory items

### `inventoryItemAllowEdit`

- **Type:** `boolean`
- **Default:** `true`

Can the user edit an inventory item?

### `inventoryItemAllowApplySticker`

- **Type:** `boolean`
- **Default:** `true`

Can the user apply stickers to inventory items?

### `inventoryItemAllowScrapeSticker`

- **Type:** `boolean`
- **Default:** `true`

Can the user scrape stickers from inventory items?

### `inventoryItemAllowRemoveSticker`

- **Type:** `boolean`
- **Default:** `true`

Can the user remove stickers from inventory items?

### `inventoryItemAllowApplyPatch`

- **Type:** `boolean`
- **Default:** `true`

Can the user apply patches to inventory items?

### `inventoryItemAllowRemovePatch`

- **Type:** `boolean`
- **Default:** `true`

Can the user remove patches from inventory items?

### `inventoryItemAllowUnlockContainer`

- **Type:** `boolean`
- **Default:** `true`

Can the user unlock container inventory items?

### `inventoryItemAllowInspectInGame`

- **Type:** `boolean`
- **Default:** `true`

Can the user inspect an item in-game?

### `inventoryItemAllowShare`

- **Type:** `boolean`
- **Default:** `true`

Can the user share an inventory item?

### `inventoryItemEquipHideModel`

- **Type:** `string-array`
- **Default:** _empty_

Prevents equipping certain models. Example: `knife_flip;bayonet`.

### `inventoryItemEquipHideType`

- **Type:** `string-array`
- **Default:** _empty_

Prevents equipping certain types. Example: `agent;weapon`.

## Craft

### `craftHideCategory`

- **Type:** `string-array`
- **Default:** _empty_

Hides a category from crafting. Example: `secondary;rifle`.

### `craftHideType`

- **Type:** `string-array`
- **Default:** _empty_

Hides a type from crafting. Example: `agent;case`.

### `craftHideFilterType`

- **Type:** `string-array`
- **Default:** _empty_

Hides type from crafting prompt. Example: `sticker`.

### `craftHideModel`

- **Type:** `string-array`
- **Default:** _empty_

Hides a model from crafting. Example: `knife_flip;bayonet`.

### `craftHideId`

- **Type:** `number-array`
- **Default:** _empty_

Hides a specific item from crafting. Example: `307`.

### `craftMaxQuantity`

- **Type:** `number`
- **Default:** `0`

Max quantity of an item that can be crafted. `0` means no limit.

### `craftAllowNametag`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Name tag when crafting?

### `craftAllowSeed`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Seed when crafting?

### `craftAllowStatTrak`

- **Type:** `boolean`
- **Default:** `true`

Can the user define StatTrak when crafting?

### `craftAllowWear`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Wear when crafting?

### `craftAllowStickers`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Stickers when crafting?

### `craftAllowStickerRotation`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Sticker Rotation when crafting?

### `craftAllowStickerWear`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Sticker Wear when crafting?

### `craftAllowStickerX`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Sticker X offset when crafting?

### `craftAllowStickerY`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Sticker Y offset when crafting?

### `craftAllowStickerSchema`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Sticker Schema when crafting?

### `craftAllowPatches`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Patches when crafting?

### `craftAllowKeychains`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Charms (keychains) when crafting?

### `craftAllowKeychainSeed`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Charm Seed when crafting?

### `craftAllowKeychainX`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Charm X offset when crafting?

### `craftAllowKeychainY`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Charm Y offset when crafting?

### `craftAllowKeychainZ`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Charm Z offset when crafting?

### `craftAllowImportInspectLink`

- **Type:** `boolean`
- **Default:** `true`

Can the user import items from inspect links when crafting?

## Edit

### `editHideCategory`

- **Type:** `string-array`
- **Default:** _empty_

Hides a category from being edited. Example: `secondary;rifle`.

### `editHideType`

- **Type:** `string-array`
- **Default:** _empty_

Hides a type from being edited. Example: `sticker;weapon`.

### `editHideModel`

- **Type:** `string-array`
- **Default:** _empty_

Hides a model from being edited. Example: `knife_flip;bayonet`.

### `editHideId`

- **Type:** `number-array`
- **Default:** _empty_

Hides a specific item from being edited. Example: `307`.

### `editAllowNametag`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Name tag when editing?

### `editAllowSeed`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Seed when editing?

### `editAllowStatTrak`

- **Type:** `boolean`
- **Default:** `true`

Can the user define StatTrak when editing?

### `editAllowWear`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Wear when editing?

### `editAllowStickers`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Stickers when editing?

### `editAllowStickerRotation`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Sticker Rotation when editing?

### `editAllowStickerWear`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Sticker Wear when editing?

### `editAllowStickerX`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Sticker X offset when editing?

### `editAllowStickerY`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Sticker Y offset when editing?

### `editAllowStickerSchema`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Sticker Schema when editing?

### `editAllowPatches`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Patches when editing?

### `editAllowKeychains`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Charms (keychains) when editing?

### `editAllowKeychainSeed`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Charm Seed when editing?

### `editAllowKeychainX`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Charm X offset when editing?

### `editAllowKeychainY`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Charm Y offset when editing?

### `editAllowKeychainZ`

- **Type:** `boolean`
- **Default:** `true`

Can the user define Charm Z offset when editing?

## CSFloat

### `csFloatUrl`

- **Type:** `string`
- **Default:** _empty_

CSFloat API URL for item inspection integration.

### `csFloatHeaders`

- **Type:** `string-array`
- **Default:** _empty_

CSFloat API request headers. Example: `Authorization;Bearer MyAPIToken`.

## Viewer

### `viewerEnabled`

- **Type:** `boolean`
- **Default:** `false`

Enable the 3D viewer (e.g. the craft sticker editor). Still gated by a reachable viewer and available rate-limit budget.

### `viewerAttachmentsOnly`

- **Type:** `boolean`
- **Default:** `false`

Restrict the 3D viewer to attachment features (applying, scraping, and positioning stickers - and keychains in the future). Item inspection and the craft item preview fall back to 2D images. Has no effect when `viewerEnabled` is `false`.

### `viewerKey`

- **Type:** `string`
- **Default:** `VIEWER_KEY` env var or _empty_

Partner key for the 3D viewer. Sent as the iframe `key` and used as a trusted-partner signal that skips the rate-limit check.

## Rule overwriting

There are two ways to overwrite rules: by adding records to `GroupRule` and `UserRule` tables. Users can be grouped by creating a record on `Group` table, and then associating each user to a group on `UserGroup`.

1. If the system finds a rule for a user in `UserRule`, that rule will be enforced.
2. If the system finds a rule for a group the user is in, on `GroupRule` table, that rule will enforced. If the user is associated to multiple groups, the rule for the group with the higher `priority` will be enforced.

> [!TIP]  
> For example, consider `admin` and `vip` groups - if a user is associated to both, you'd make sure `admin`'s `priority` is higher than `vip`'s.
