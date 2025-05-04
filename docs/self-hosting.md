# Self-hosting

If you are looking into self-hosting your own Inventory Simulator instance, check out our [Dockerfile](https://github.com/ianlucas/cs2-inventory-simulator/blob/main/Dockerfile) for a more precise step-by-step instruction for building and starting the app.

## Steps for building and starting the app

1. Have at least Node 20.x installed in your system.
2. Have a Postgres database instance up and running. Figure that out first before building the app.
3. Rename `.env.example` to `.env` with the proper environment variable values, including the database URL.
4. `npm install` to install dependencies.
5. `npx prisma migrate deploy` to sync database.
6. `npm run build` to build application.
7. `npm run start` to start application.

> [!IMPORTANT]  
> Authentication requires the rules `steamApiKey` and `steamCallbackUrl` (in `public.Rule` table) to be properly configured to work.

### Can I use a MySQL database?

Yes, but you need to maintain your own Prisma migration. Make sure to double check fields noted as `String` in our [schema.prisma](https://github.com/ianlucas/cs2-inventory-simulator/blob/main/prisma/schema.prisma) as it [does not](https://www.prisma.io/docs/orm/reference/prisma-schema-reference#string) translate 1:1 to MySQL.

[Follow this guide as an example of using MySQL.](https://github.com/ianlucas/cs2-inventory-simulator/discussions/92)

## Configuring the app

There is no admin interface in Inventory Simulator, so you need to interact with the database to configure runtime logic. The main table is `public.Rule` where you can configure [some runtime logic](https://github.com/ianlucas/cs2-inventory-simulator/blob/main/docs/rules.md).

### Using the API

Inventory Simulator also [exposes some API endpoints](https://github.com/ianlucas/cs2-inventory-simulator/blob/main/docs/api.md) that can be used by other applications, such as [Inventory Simulator Plugin](https://github.com/ianlucas/cs2-inventory-simulator-plugin). For endpoints that require API keys, you need to create them in `public.ApiCredential` table.

#### Creating new API keys

Insert a row into `public.ApiCredential` table, here's a description of the important columns:

- `apiKey`: a hash or uuid to be used as a key. It's up to you to [generate one](https://www.random.org/strings/?num=1&len=16&digits=on&upperalpha=on&loweralpha=on&unique=on&format=html&rnd=new).
- `scope`: which APIs this `apiKey` has permission to use. Comma-separated (e.g. `scope1,scope2`). Check each API for their specific scopes. `api` scope has access to all APIs (not recommended for applications using specific APIs).
- `comment`: a comment you may want to include in this row.
