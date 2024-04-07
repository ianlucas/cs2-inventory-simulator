# Rules

CS2 Inventory Simulator can be configured at runtime using rules. These rules can modify various behaviors of the app, such as enabling users to edit items and adding new ones. Each rule that can be altered is stored in the Rule table.

## Current rules

### `SteamApiKey`

- Steam API Key is used to retrieve user information from Steam.
- **Type:** `string`

> [!CAUTION]  
> Authentication requires a valid Steam API Key.

### `SteamCallbackUrl`

- This URL is called to validate the user's authentication on Steam.
- **Type:** `string`
- **Expected value:** `https://your.domain/sign-in/steam/callback`

> [!CAUTION]  
> You need to setup this URL for the authentication to work.

### `InventoryMaxItems`

- The maximum number of items a user can add to the inventory.
- **Type:** `number`
- **Default:** `256`

### `InventoryStorageUnitMaxItems`

- The maximum number of items a storage unit can store.
- **Type:** `number`
- **Default:** `32`

### `InventoryItemAllowEdit`

- Indicates whether the user can edit an inventory item.
- **Type:** `boolean`
- **Default:** `false`

> [!WARNING]  
> You can find all possible items and their attributes [here](https://raw.githubusercontent.com/ianlucas/cslib/main/assets/data/items.json).

### `CraftHideCategory`

- Determines whether to hide a category when crafting an item. This also prevents the item from being added by the user.
- **Type:** `string-array`
- **Usage example:** `secondary;rifle` (Users won't be able to craft secondary and rifle items.)

### `CraftHideType`

- Determines whether to hide a type when crafting an item. This also prevents the item from being added by the user.
- **Type:** `string-array`
- **Usage example:** `agent;case` (Users won't be able to craft agent and case items.)

### `CraftHideModel`

- Determines whether to hide a model when crafting an item. This also prevents the item from being added by the user.
- **Type:** `string-array`
- **Usage example:** `knife_flip;bayonet` (Users won't be able to craft flip and bayonet knives.)

### `CraftHideId`

- Determines whether to hide an item when crafting. This also prevents the item from being added by the user.
- **Type:** `number-array`
- **Usage example:** `307` (Users won't be able to craft AWP | Dragon Lore.)

## Rule overwriting

There are two ways to overwrite rules: by adding records to `GroupRole` and `UserRule` tables. Users can be grouped by creating a record on `Group` table, and then associating each user to a group on `UserGroup`.

1. If the system finds a rule for a user in `UserRule`, that rule will be enforced.
2. If the system finds a rule for a group the user is in, on `GroupRule` table, that rule will enforced. If the user is associated to multiple groups, the rule for the group with the higher `priority` will be enforced.

> [!TIP]  
> For example, consider `admin` and `vip` groups - if a user is associated to both, you'd make sure `admin`'s `priority` is higher than `vip`'s.
