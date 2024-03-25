# Rules

CS2 Inventory Simulator can be configured during runtime using rules. They can be used to change some behaviors of the app, such as allowing players to edit items and ability to add them. Every rule that can be changed is stored in `Rule` table.

## Current rules

### `SteamApiKey`

- Description: Steam API Key to be used to get players information.
- Type: `string`

> [!CAUTION]
> You need a valid Steam API Key for the authentication to work.

### `SteamCallbackUrl`

- Description: URL that will be called to validate the user's authentication on Steam.
- Type: `string`
- Expected value: `https://your.domain/sign-in/steam/callback`

> [!CAUTION]
> You need to setup this URL for the authentication to work.

### `InventoryMaxItems`

- Description: Total items the player can add to the inventory.
- Type: `number`
- Default: `256`

### `InventoryStorageUnitMaxItems`

- Description: Total items a storage unit can store.
- Type: `number`
- Default: `32`

### `InventoryItemAllowEdit`

- Description: Whether the user can edit an inventory item.
- Type: `boolean`
- Default: `false`

> [!WARNING] 
> You can get all the possible items and their attributes [here](https://raw.githubusercontent.com/ianlucas/cslib/main/assets/data/items.json).

### `CraftHideCategory`

- Description: Whether hide a category when crafting an item. This also prevents the item to be added by the player.
- Type: `string-array`
- Usage example: `secondary;rifle` (Players won't be able to craft secondary and rifle items.)

### `CraftHideType`

- Description: Whether hide a type when crafting an item. This also prevents the item to be added by the player.
- Type: `string-array`
- Usage example: `agent;case` (Players won't be able to craft agent and case items.)

### `CraftHideModel`

- Description: Whether hide a model when crafting an item. This also prevents the item to be added by the player.
- Type: `string-array`
- Usage example: `knife_flip;bayonet` (Players won't be able to craft flip and bayonet knives.)

### `CraftHideId`

- Description: Whether hide an item when crafting. This also prevents the item to be added by the player.
- Type: `number-array`
- Usage example: `307` (Players won't be able to craft AWP | Dragon Lore.)

## Rule overwriting

A rule can be overwritten when a recorded is added to `RuleOverwrite` table with the user and rule name and the value the application should see.
