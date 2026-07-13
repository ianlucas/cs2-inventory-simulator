# Rules

CS2 Inventory Simulator can be configured at runtime using rules. These rules can modify various behaviors of the app, such as enabling users to edit items and adding new ones. Each rule that can be altered is stored in the Rule table.

> [!TIP]  
> You can find all possible items and their attributes [here](https://raw.githubusercontent.com/ianlucas/cs2-lib/refs/heads/main/scripts/data/items.json).

## App

### `appName`

Name of the app. If empty, uses Inventory Simulator's default value.

**Type:** `string` · **Default:** _empty_

### `appFooterName`

Name in the footer of the app. If empty, uses Inventory Simulator's default value.

**Type:** `string` · **Default:** _empty_

### `appLogoUrl`

URL of the app's logo. If empty, uses Inventory Simulator's logo. Restart required.

**Type:** `string` · **Default:** _empty_

### `appFaviconUrl`

URL of the app's favicon. If empty, uses Inventory Simulator's favicon.

**Type:** `string` · **Default:** _empty_

### `appFaviconMimeType`

MIME type of the app's favicon. If empty, uses Inventory Simulator's favicon MIME type.

**Type:** `string` · **Default:** _empty_

### `appSeoDescription`

SEO description for the app. If empty, uses Inventory Simulator's default value.

**Type:** `string` · **Default:** _empty_

### `appSeoImageUrl`

SEO image for the app. If empty, uses Inventory Simulator's default value.

**Type:** `string` · **Default:** _empty_

### `appSeoTitle`

SEO title for the app. If empty, uses Inventory Simulator's default value.

**Type:** `string` · **Default:** _empty_

### `appCountry`

Country of the application (ISO-3166-1 alpha-2 code). Changes language if available.

**Type:** `string` · **Default:** `us`

### `appCacheInventory`

Cache user's inventory if offline or unauthenticated.

**Type:** `boolean` · **Default:** `true`

### `appHideLogo`

Hide the logo in the app.

**Type:** `boolean` · **Default:** `false`

### `appHideAuth`

Hide authentication controls in the app.

**Type:** `boolean` · **Default:** `false`

### `appEnable3dViewer`

Enable the 3D viewer (e.g. the craft sticker editor). Still gated by a reachable viewer and available rate-limit budget.

**Type:** `boolean` · **Default:** `false`

### `app3dViewerKey`

Partner key for the 3D viewer. Sent as the iframe `key` and used as a trusted-partner signal that skips the rate-limit check.

**Type:** `string` · **Default:** `VIEWER_KEY` env var or _empty_

## Steam

> [!CAUTION]  
> Both `steamApiKey` and `steamCallbackUrl` are required for authentication to work.

### `steamApiKey`

Steam API Key is used to retrieve user information from Steam.

**Type:** `string` · **Default:** `STEAM_API_KEY` env var or `YOUR_STEAM_API_KEY_GOES_HERE`

### `steamCallbackUrl`

URL to validate Steam authentication.

**Type:** `string` · **Default:** `STEAM_CALLBACK_URL` env var or `http://localhost/sign-in/steam/callback`

## Inventory

### `inventoryMaxItems`

Max number of items a user can add to inventory.

**Type:** `number` · **Default:** `256`

### `inventoryStorageUnitMaxItems`

Max items a storage unit can store.

**Type:** `number` · **Default:** `32`

### `inventoryInactivityResetDays`

Resets (deletes) a user's inventory after this many days without logging into the website or being fetched by the game server. `0` disables the rule. Set a per-user or per-group overwrite to `0` to make them immune.

**Type:** `number` · **Default:** `0`

## Inventory items

### `inventoryItemAllowEdit`

Can the user edit an inventory item?

**Type:** `boolean` · **Default:** `true`

### `inventoryItemAllowApplySticker`

Can the user apply stickers to inventory items?

**Type:** `boolean` · **Default:** `true`

### `inventoryItemAllowScrapeSticker`

Can the user scrape stickers from inventory items?

**Type:** `boolean` · **Default:** `true`

### `inventoryItemAllowRemoveSticker`

Can the user remove stickers from inventory items?

**Type:** `boolean` · **Default:** `true`

### `inventoryItemAllowApplyPatch`

Can the user apply patches to inventory items?

**Type:** `boolean` · **Default:** `true`

### `inventoryItemAllowRemovePatch`

Can the user remove patches from inventory items?

**Type:** `boolean` · **Default:** `true`

### `inventoryItemAllowUnlockContainer`

Can the user unlock container inventory items?

**Type:** `boolean` · **Default:** `true`

### `inventoryItemAllowInspectInGame`

Can the user inspect an item in-game?

**Type:** `boolean` · **Default:** `true`

### `inventoryItemAllowShare`

Can the user share an inventory item?

**Type:** `boolean` · **Default:** `true`

### `inventoryItemEquipHideModel`

Prevents equipping certain models. Example: `knife_flip;bayonet`.

**Type:** `string-array` · **Default:** _empty_

### `inventoryItemEquipHideType`

Prevents equipping certain types. Example: `agent;weapon`.

**Type:** `string-array` · **Default:** _empty_

## Craft

### `craftHideCategory`

Hides a category from crafting. Example: `secondary;rifle`.

**Type:** `string-array` · **Default:** _empty_

### `craftHideType`

Hides a type from crafting. Example: `agent;case`.

**Type:** `string-array` · **Default:** _empty_

### `craftHideFilterType`

Hides type from crafting prompt. Example: `sticker`.

**Type:** `string-array` · **Default:** _empty_

### `craftHideModel`

Hides a model from crafting. Example: `knife_flip;bayonet`.

**Type:** `string-array` · **Default:** _empty_

### `craftHideId`

Hides a specific item from crafting. Example: `307`.

**Type:** `number-array` · **Default:** _empty_

### `craftMaxQuantity`

Max quantity of an item that can be crafted. `0` means no limit.

**Type:** `number` · **Default:** `0`

### `craftAllowNametag`

Can the user define Name tag when crafting?

**Type:** `boolean` · **Default:** `true`

### `craftAllowSeed`

Can the user define Seed when crafting?

**Type:** `boolean` · **Default:** `true`

### `craftAllowStatTrak`

Can the user define StatTrak when crafting?

**Type:** `boolean` · **Default:** `true`

### `craftAllowWear`

Can the user define Wear when crafting?

**Type:** `boolean` · **Default:** `true`

### `craftAllowStickers`

Can the user define Stickers when crafting?

**Type:** `boolean` · **Default:** `true`

### `craftAllowStickerRotation`

Can the user define Sticker Rotation when crafting?

**Type:** `boolean` · **Default:** `true`

### `craftAllowStickerWear`

Can the user define Sticker Wear when crafting?

**Type:** `boolean` · **Default:** `true`

### `craftAllowStickerX`

Can the user define Sticker X offset when crafting?

**Type:** `boolean` · **Default:** `true`

### `craftAllowStickerY`

Can the user define Sticker Y offset when crafting?

**Type:** `boolean` · **Default:** `true`

### `craftAllowStickerSchema`

Can the user define Sticker Schema when crafting?

**Type:** `boolean` · **Default:** `true`

### `craftAllowPatches`

Can the user define Patches when crafting?

**Type:** `boolean` · **Default:** `true`

### `craftAllowKeychains`

Can the user define Charms (keychains) when crafting?

**Type:** `boolean` · **Default:** `true`

### `craftAllowKeychainSeed`

Can the user define Charm Seed when crafting?

**Type:** `boolean` · **Default:** `true`

### `craftAllowKeychainX`

Can the user define Charm X offset when crafting?

**Type:** `boolean` · **Default:** `true`

### `craftAllowKeychainY`

Can the user define Charm Y offset when crafting?

**Type:** `boolean` · **Default:** `true`

### `craftAllowKeychainZ`

Can the user define Charm Z offset when crafting?

**Type:** `boolean` · **Default:** `true`

### `craftAllowImportInspectLink`

Can the user import items from inspect links when crafting?

**Type:** `boolean` · **Default:** `true`

## Edit

### `editHideCategory`

Hides a category from being edited. Example: `secondary;rifle`.

**Type:** `string-array` · **Default:** _empty_

### `editHideType`

Hides a type from being edited. Example: `sticker;weapon`.

**Type:** `string-array` · **Default:** _empty_

### `editHideModel`

Hides a model from being edited. Example: `knife_flip;bayonet`.

**Type:** `string-array` · **Default:** _empty_

### `editHideId`

Hides a specific item from being edited. Example: `307`.

**Type:** `number-array` · **Default:** _empty_

### `editAllowNametag`

Can the user define Name tag when editing?

**Type:** `boolean` · **Default:** `true`

### `editAllowSeed`

Can the user define Seed when editing?

**Type:** `boolean` · **Default:** `true`

### `editAllowStatTrak`

Can the user define StatTrak when editing?

**Type:** `boolean` · **Default:** `true`

### `editAllowWear`

Can the user define Wear when editing?

**Type:** `boolean` · **Default:** `true`

### `editAllowStickers`

Can the user define Stickers when editing?

**Type:** `boolean` · **Default:** `true`

### `editAllowStickerRotation`

Can the user define Sticker Rotation when editing?

**Type:** `boolean` · **Default:** `true`

### `editAllowStickerWear`

Can the user define Sticker Wear when editing?

**Type:** `boolean` · **Default:** `true`

### `editAllowStickerX`

Can the user define Sticker X offset when editing?

**Type:** `boolean` · **Default:** `true`

### `editAllowStickerY`

Can the user define Sticker Y offset when editing?

**Type:** `boolean` · **Default:** `true`

### `editAllowStickerSchema`

Can the user define Sticker Schema when editing?

**Type:** `boolean` · **Default:** `true`

### `editAllowPatches`

Can the user define Patches when editing?

**Type:** `boolean` · **Default:** `true`

### `editAllowKeychains`

Can the user define Charms (keychains) when editing?

**Type:** `boolean` · **Default:** `true`

### `editAllowKeychainSeed`

Can the user define Charm Seed when editing?

**Type:** `boolean` · **Default:** `true`

### `editAllowKeychainX`

Can the user define Charm X offset when editing?

**Type:** `boolean` · **Default:** `true`

### `editAllowKeychainY`

Can the user define Charm Y offset when editing?

**Type:** `boolean` · **Default:** `true`

### `editAllowKeychainZ`

Can the user define Charm Z offset when editing?

**Type:** `boolean` · **Default:** `true`

## CSFloat

### `csFloatUrl`

CSFloat API URL for item inspection integration.

**Type:** `string` · **Default:** _empty_

### `csFloatHeaders`

CSFloat API request headers. Example: `Authorization;Bearer MyAPIToken`.

**Type:** `string-array` · **Default:** _empty_

## Rule overwriting

There are two ways to overwrite rules: by adding records to `GroupRule` and `UserRule` tables. Users can be grouped by creating a record on `Group` table, and then associating each user to a group on `UserGroup`.

1. If the system finds a rule for a user in `UserRule`, that rule will be enforced.
2. If the system finds a rule for a group the user is in, on `GroupRule` table, that rule will enforced. If the user is associated to multiple groups, the rule for the group with the higher `priority` will be enforced.

> [!TIP]  
> For example, consider `admin` and `vip` groups - if a user is associated to both, you'd make sure `admin`'s `priority` is higher than `vip`'s.
