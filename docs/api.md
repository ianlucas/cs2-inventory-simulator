# API for Developers

CS2 Inventory Simulator exposes a couple of endpoints to be used in other applications.

## Get user inventory

```http
GET https://inventory.cstrike.app/api/inventory/{steamID64}.json
```

### Response

- Returns `200` (`application/json`).

```typescript
type GetUserInventoryResponse = {
  items: Record<
    number,
    {
      containerId?: number;
      equipped?: boolean;
      equippedCT?: boolean;
      equippedT?: boolean;
      id: number;
      nameTag?: string;
      patches?: Record<number, number>;
      seed?: number;
      statTrak?: number;
      stickers?: Record<
        number,
        {
          id: number;
          wear?: number;
          x?: number;
          y?: number;
        }
      >;
      storage?: Record<
        number,
        {
          containerId?: number;
          equipped?: boolean;
          equippedCT?: boolean;
          equippedT?: boolean;
          id: number;
          nameTag?: string;
          patches?: Record<number, number>;
          seed?: number;
          statTrak?: number;
          stickers?: Record<
            number,
            {
              id: number;
              rotation?: number;
              wear?: number;
              x?: number;
              y?: number;
            }
          >;
          updatedAt?: number;
          wear?: number;
        }
      >;
      updatedAt?: number;
      wear?: number;
    }
  >;
  version: number;
};
```

## Get user equipped items

```http
GET https://inventory.cstrike.app/api/equipped/v3/{steamID64}.json
```

### Response

- Returns `200` (`application/json`).

```typescript
interface BaseEconItem {
  def: number;
  paint: number;
  seed: number;
  wear: number;
}
interface WeaponEconItem extends BaseEconItem {
  legacy: boolean;
  nametag: string;
  stattrak: number;
  stickers: {
    def: number;
    rotation?: number;
    slot: number;
    wear: number;
    x?: number;
    y?: number;
  }[];
  uid: number;
}
interface AgentItem {
  model: string;
  patches: number[];
  vofallback: boolean;
  vofemale: boolean;
  voprefix: string;
}
interface MusicKitItem {
  def: number;
  stattrak: number;
  uid: number;
}
interface GraffitiItem {
  def: number;
  tint: number;
}
type GetUserEquippedItemsResponse = {
  agents?: Record<number, AgentItem>;
  ctWeapons?: Record<number, WeaponEconItem>;
  gloves?: Record<number, BaseEconItem>;
  graffiti?: GraffitiItem;
  knives?: Record<number, WeaponEconItem>;
  musicKit?: MusicKitItem;
  pin?: number;
  tWeapons?: Record<number, WeaponEconItem>;
};
```

## Increment item StatTrak

```http
POST https://inventory.cstrike.app/api/increment-item-stattrak
```

### Request

> [!IMPORTANT]  
> API key must have `api` or `stattrak_increment` scope.

```typescript
type PostIncrementItemStatTrakRequest = {
  apiKey: string;
  targetUid: number;
  userId: string;
};
```

### Response

- Returns `401` when using an invalid API key.
- Returns `400` when the user does not exist or target uid is invalid.
- Returns `204` when the increment was successful.

## Add Item

```http
POST https://inventory.cstrike.app/api/add-item
```

### Request

> [!IMPORTANT]  
> API key must have `api` or `inventory` scope.

```typescript
type PostAddItemRequest = {
  apiKey: string;
  userId: string;
  inventoryItem: {
    id: number;
    wear?: number | undefined;
    nameTag?: string | undefined;
    patches?: Record<string, number> | undefined;
    seed?: number | undefined;
    statTrak?: 0 | undefined;
    stickers?:
      | Record<
          string,
          {
            id: number;
            wear?: number | undefined;
            x?: number | undefined;
            y?: number | undefined;
          }
        >
      | undefined;
  };
};
```

### Response

- Returns `401` when using an invalid API key.
- Returns `400` when the user does not exist, inventory is full, or inventory item is invalid.
- Returns `204` when the item was added to user's inventory.

## Add Container

```http
POST https://inventory.cstrike.app/api/add-container
```

### Request

> [!IMPORTANT]  
> API key must have `api` or `inventory` scope.

```typescript
type PostAddContainerRequest = {
  apiKey: string;
  userId: string;
  name?: string | undefined;
  graffiti?: boolean | undefined;
  language?: string | undefined;
  souvenir?: boolean | undefined;
  stickerCapsule?: boolean | undefined;
  weapon?: boolean | undefined;
};
```

### Response

- Returns `401` when using an invalid API key.
- Returns `400` when the user does not exist, inventory is full, or filter is invalid.
- Returns `200` (`application/json`) when a random container was added to user's inventory.

```typescript
type PostAddContainerResponse = {
  altName?: string | undefined;
  base?: boolean | undefined;
  baseId?: number | undefined;
  category?: string | undefined;
  category?: string | undefined;
  collection?: string | undefined;
  collectionDesc?: string | undefined;
  collectionName?: string | undefined;
  containerType?: CS2ContainerTypeValues | undefined;
  contents?: number[] | undefined;
  def?: number | undefined;
  desc?: string | undefined;
  free?: boolean | undefined;
  id: number;
  image?: string | undefined;
  index?: number | undefined;
  keys?: number[] | undefined;
  legacy?: boolean | undefined;
  model?: string | undefined;
  name: string;
  rarity?: CS2RarityColorValues | undefined;
  specials?: number[] | undefined;
  specialsImage?: boolean | undefined;
  statTrakless?: boolean | undefined;
  statTrakOnly?: boolean | undefined;
  teams?: CS2ItemTeamValues | undefined;
  tint?: number | undefined;
  tournamentDesc?: string | undefined;
  type: CS2ItemTypeValues;
  voFallback?: boolean | undefined;
  voFemale?: boolean | undefined;
  voPrefix?: string | undefined;
  wearMax?: number | undefined;
  wearMin?: number | undefined;
};
```

## Sign-in user

This is intended to be used in other first-party apps to authenticate users to Inventory Simulator. First, a POST request must be sent to `/api/sign-in` to get the user's authentication `token`, then the user must be immediately redirected to `/api/sign-in/callback?token={token}`.

### Get user sign-in token

```http
POST https://inventory.cstrike.app/api/sign-in
```

#### Request

> [!IMPORTANT]  
> API key must have `api_auth` scope.

```typescript
type GetUserSignInTokenRequest = {
  apiKey: string;
  userId: string;
};
```

#### Response

- Returns `401` when using an invalid API key.
- Returns `400` when the user does not exist.
- Returns `200` (`application/json`) when a token is generated.

```typescript
type GetUserSignInTokenResponse = {
  token: string; // expires in 1 minute.
};
```

### Sign-in user

```http
GET https://inventory.cstrike.app/api/sign-in/callback?token={token}
```

#### Response

- Returns `302` redirecting to `https://inventory.cstrike.app/api/action/preferences` if the authentication was successful, otherwise to `https://inventory.cstrike.app`.
