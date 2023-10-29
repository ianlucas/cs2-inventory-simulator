# [inventory.cstrike.app](https://inventory.cstrike.app/)

<img src="https://raw.githubusercontent.com/ianlucas/cs2-inventory-simulator/master/InventorySimulator.png" alt="Inventory Simulator homepage" title="CS2 Inventory Simulator" />

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
