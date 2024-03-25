# Rules

The CS2 Inventory Simulator can be configured at runtime using rules. These rules can modify various behaviors of the app, such as enabling users to edit items and adding new ones. Each rule that can be altered is stored in the Rule table.

## Current rules

### `SteamApiKey`

- Description: Steam API Key is used to retrieve user information from Steam.
- Type: `string`

> [!CAUTION]
> Authentication requires a valid Steam API Key.

### `SteamCallbackUrl`

- Description: This URL is called to validate the user's authentication on Steam.
- Type: `string`
- Expected value: `https://your.domain/sign-in/steam/callback`

> [!CAUTION]
> You need to setup this URL for the authentication to work.

### `InventoryMaxItems`

- Description: The maximum number of items a user can add to the inventory.
- Type: `number`
- Default: `256`

### `InventoryStorageUnitMaxItems`

- Description: The maximum number of items a storage unit can store.
- Type: `number`
- Default: `32`

### `InventoryItemAllowEdit`

- Description: Indicates whether the user can edit an inventory item.
- Type: `boolean`
- Default: `false`

> [!WARNING]
> You can find all possible items and their attributes [here](https://raw.githubusercontent.com/ianlucas/cslib/main/assets/data/items.json).

### `CraftHideCategory`

- Description: Determines whether to hide a category when crafting an item. This also prevents the item from being added by the user.
- Type: `string-array`
- Usage example: `secondary;rifle` (Users won't be able to craft secondary and rifle items.)

### `CraftHideType`

- Description: Determines whether to hide a type when crafting an item. This also prevents the item from being added by the user.
- Type: `string-array`
- Usage example: `agent;case` (Users won't be able to craft agent and case items.)

### `CraftHideModel`

- Description: Determines whether to hide a model when crafting an item. This also prevents the item from being added by the user.
- Type: `string-array`
- Usage example: `knife_flip;bayonet` (Users won't be able to craft flip and bayonet knives.)

### `CraftHideId`

- Description: Determines whether to hide an item when crafting. This also prevents the item from being added by the user.
- Type: `number-array`
- Usage example: `307` (Users won't be able to craft AWP | Dragon Lore.)

## Rule overwriting

A rule can be overwritten by adding a record to the `RuleOverwrite` table with the user's SteamID64, the rule name, and the value the application should consider instead.
