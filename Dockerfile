# Adapted from Remix's Indie Stack
FROM node:18-bullseye-slim as base

ENV NODE_ENV production

# Install Prisma dependencies
RUN apt-get update && apt-get install -y openssl git
RUN git log -n 1 --pretty=format:%H > .build-last-commit

# Install Inventory Simulator dependencies
FROM base as deps

WORKDIR /myapp

ADD package.json ./
ADD .build-last-commit ./
RUN npm install --include=dev

# Setup production node_modules
FROM base as production-deps

WORKDIR /myapp

COPY --from=deps /myapp/node_modules /myapp/node_modules
ADD package.json ./
RUN npm prune --omit=dev

# Build the app
FROM base as build

WORKDIR /myapp

COPY --from=deps /myapp/node_modules /myapp/node_modules

ADD prisma .
RUN npx prisma generate

ADD . .
RUN npm run build

# Finally, build the production image with minimal footprint
FROM base

ENV NODE_ENV="production"

WORKDIR /myapp

COPY --from=production-deps /myapp/node_modules /myapp/node_modules
COPY --from=build /myapp/node_modules/.prisma /myapp/node_modules/.prisma

COPY --from=build /myapp/build /myapp/build
COPY --from=build /myapp/public /myapp/public
COPY --from=build /myapp/package.json /myapp/package.json
COPY --from=build /myapp/.build-last-commit /myapp/.build-last-commit
COPY --from=build /myapp/start.sh /myapp/start.sh
COPY --from=build /myapp/prisma /myapp/prisma

ENTRYPOINT [ "./start.sh" ]
