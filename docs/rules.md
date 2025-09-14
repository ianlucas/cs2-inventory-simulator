# Rules

CS2 Inventory Simulator can be configured at runtime using rules. These rules can modify various behaviors of the app, such as enabling users to edit items and adding new ones. Each rule that can be altered is stored in the Rule table.

> [!TIP]  
> You can find all possible items and their attributes [here](https://raw.githubusercontent.com/ianlucas/cs2-lib/refs/heads/main/scripts/data/items.json).

## Current rules

| Name | Description | Type | Default |
| --- | --- | --- | --- |
| `appName` | Name of the app. If empty, uses Inventory Simulator's default value. | `string` | _Empty_ |
| `appFooterName` | Name in the footer of the app. If empty, uses Inventory Simulator's default value. | `string` | _Empty_ |
| `appLogoUrl` | URL of the app's logo. If empty, uses Inventory Simulator's logo. Restart required. | `string` | _Empty_ |
| `appFaviconUrl` | URL of the app's favicon. If empty, uses Inventory Simulator's favicon. | `string` | _Empty_ |
| `appFaviconMimeType` | MIME type of the app's favicon. If empty, uses Inventory Simulator's favicon MIME type. | `string` | _Empty_ |
| `appSeoDescription` | SEO description for the app. If empty, uses Inventory Simulator's default value. | `string` | _Empty_ |
| `appSeoImageUrl` | SEO image for the app. If empty, uses Inventory Simulator's default value. | `string` | _Empty_ |
| `appSeoTitle` | SEO title for the app. If empty, uses Inventory Simulator's default value. | `string` | _Empty_ |
| `appCountry` | Country of the application (ISO-3166-1 alpha-2 code). Changes language if available. | `string` | `us` |
| `steamApiKey` | Steam API Key is used to retrieve user information from Steam. | `string` | Env var or `YOUR_STEAM_API_KEY_GOES_HERE` |
| `steamCallbackUrl` | URL to validate Steam authentication. | `string` | Env var or `http://localhost/sign-in/steam/callback` |
| `appCacheInventory` | Cache user's inventory if offline or unauthenticated. | `boolean` | `true` |
| `inventoryMaxItems` | Max number of items a user can add to inventory. | `number` | `256` |
| `inventoryStorageUnitMaxItems` | Max items a storage unit can store. | `number` | `32` |
| `inventoryItemAllowEdit` | Can the user edit an inventory item? | `boolean` | `false` |
| `inventoryItemAllowApplySticker` | Can the user apply stickers to inventory items? | `boolean` | `true` |
| `inventoryItemAllowScrapeSticker` | Can the user scrape stickers from inventory items? | `boolean` | `true` |
| `inventoryItemAllowApplyPatch` | Can the user apply patches to inventory items? | `boolean` | `true` |
| `inventoryItemAllowRemovePatch` | Can the user remove patches from inventory items? | `boolean` | `true` |
| `inventoryItemAllowUnlockContainer` | Can the user unlock container inventory items? | `boolean` | `true` |
| `inventoryItemAllowInspectInGame` | Can the user inspect an item in-game? | `boolean` | `true` |
| `inventoryItemAllowShare` | Can the user share an inventory item? | `boolean` | `true` |
| `inventoryItemEquipHideModel` | Prevents equipping certain models. Example: `knife_flip;bayonet`. | `string-array` | _Empty_ |
| `inventoryItemEquipHideType` | Prevents equipping certain types. Example: `agent;weapon`. | `string-array` | _Empty_ |
| `craftHideCategory` | Hides a category from crafting. Example: `secondary;rifle`. | `string-array` | _Empty_ |
| `craftHideType` | Hides a type from crafting. Example: `agent;case`. | `string-array` | _Empty_ |
| `craftHideFilterType` | Hides type from crafting prompt. Example: `sticker`. | `string-array` | _Empty_ |
| `craftHideModel` | Hides a model from crafting. Example: `knife_flip;bayonet`. | `string-array` | _Empty_ |
| `craftHideId` | Hides a specific item from crafting. Example: `307`. | `number-array` | _Empty_ |
| `craftAllowNametag` | Can the user define Name tag when crafting? | `boolean` | `true` |
| `craftAllowSeed` | Can the user define Seed when crafting? | `boolean` | `true` |
| `craftAllowStatTrak` | Can the user define StatTrak when crafting? | `boolean` | `true` |
| `craftAllowStickers` | Can the user define Stickers when crafting? | `boolean` | `true` |
| `craftAllowPatches` | Can the user define Patches when crafting? | `boolean` | `true` |
| `craftAllowWear` | Can the user define Wear when crafting? | `boolean` | `true` |
| `craftMaxQuantity` | Max quantity of an item that can be crafted. `0` means no limit. | `number` | `0` |
| `craftAllowStickerRotation` | Can the user define Sticker Rotation when crafting? | `boolean` | `true` |
| `craftAllowStickerWear` | Can the user define Sticker Wear when crafting? | `boolean` | `true` |
| `craftAllowStickerX` | Can the user define Sticker X offset when crafting? | `boolean` | `true` |
| `craftAllowStickerY` | Can the user define Sticker Y offset when crafting? | `boolean` | `true` |
| `editHideCategory` | Hides a category from being edited. Example: `secondary;rifle`. | `string-array` | _Empty_ |
| `editHideType` | Hides a type from being edited. Example: `sticker;weapon`. | `string-array` | _Empty_ |
| `editHideModel` | Hides a model from being edited. Example: `knife_flip;bayonet`. | `string-array` | _Empty_ |
| `editHideId` | Hides a specific item from being edited. Example: `307`. | `number-array` | _Empty_ |
| `editAllowNametag` | Can the user define Name tag when editing? | `boolean` | `true` |
| `editAllowSeed` | Can the user define Seed when editing? | `boolean` | `true` |
| `editAllowStatTrak` | Can the user define StatTrak when editing? | `boolean` | `true` |
| `editAllowStickers` | Can the user define Stickers when editing? | `boolean` | `true` |
| `editAllowPatches` | Can the user define Patches when editing? | `boolean` | `true` |
| `editAllowWear` | Can the user define Wear when editing? | `boolean` | `true` |
| `editAllowStickerRotation` | Can the user define Sticker Rotation when editing? | `boolean` | `true` |
| `editAllowStickerWear` | Can the user define Sticker Wear when editing? | `boolean` | `true` |
| `editAllowStickerX` | Can the user define Sticker X offset when editing? | `boolean` | `true` |
| `editAllowStickerY` | Can the user define Sticker Y offset when editing? | `boolean` | `true` |

> [!CAUTION]  
> Both `steamApiKey` and `steamCallbackUrl` are required for authentication to work.

## Rule overwriting

There are two ways to overwrite rules: by adding records to `GroupRole` and `UserRule` tables. Users can be grouped by creating a record on `Group` table, and then associating each user to a group on `UserGroup`.

1. If the system finds a rule for a user in `UserRule`, that rule will be enforced.
2. If the system finds a rule for a group the user is in, on `GroupRule` table, that rule will enforced. If the user is associated to multiple groups, the rule for the group with the higher `priority` will be enforced.

> [!TIP]  
> For example, consider `admin` and `vip` groups - if a user is associated to both, you'd make sure `admin`'s `priority` is higher than `vip`'s.
