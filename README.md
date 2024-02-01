# [inventory.cstrike.app](https://inventory.cstrike.app/)

A Counter-Strike 2 **Inventory Simulator** for the web using TypeScript and Remix.

<img src="https://raw.githubusercontent.com/ianlucas/cs2-inventory-simulator/main/screenshot1.png" alt="Inventory Simulator homepage" title="CS2 Inventory Simulator" />

<img src="https://raw.githubusercontent.com/ianlucas/cs2-inventory-simulator/main/screenshot2.png" alt="Inventory Simulator case opening" title="CS2 Inventory Simulator" />

## Feature Overview

- **Authentication is optional:** most features work without authentication.
- **Steam authentication:** enables Steam players to sync their inventories.
- **Craft Items:** add items to your inventory, including Weapons (Pistol, SMG, Heavy, Rifle), Knives, Gloves, Stickers, Agents, Patches, Music Kits, Graffiti, Pins, Cases, Keys, and Tools.
- **Equip Items:** equip items as you would do in-game.
- **Case Opening:** unlock cases by using Cases and their Keys.
- **Item Renaming:** use the Name Tag tool to rename items.
- **Apply/Scrape Stickers:** apply and scrape stickers from items.
- **API for developers:** fetch a user inventory and equipped items by using HTTP endpoints.
- **Partial support for mobile devices**

## Reporting Issues and Feature Requests

Please be sure to add the following prefixes in the title when opening an issue:

- [BUG] for issues you have found within the core functionality.
- [Q] for questions you may have about the project.
- [REQ] for requesting a feature not currently implemented.

## Development

From your terminal:

```sh
npm run dev
```

This starts your app in development mode, rebuilding assets on file changes.

## Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `remix build`

- `build/`
- `public/build/`
