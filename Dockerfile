# Adapted from Remix's Indie Stack
FROM node:18-bullseye-slim as base

ENV NODE_ENV production

# Install Prisma dependencies
RUN apt-get update && apt-get install -y openssl git

# Install dependencies
FROM base as deps

WORKDIR /myapp
COPY package.json package-lock.json ./
RUN npm install --include=dev

# Generate Prisma client, add commit hash, and build the app
FROM deps as build

COPY prisma ./prisma
RUN npx prisma generate

# Copy source code and capture the last Git commit hash
COPY .git ./.git
RUN git log -n 1 --pretty=format:%H > .build-last-commit
RUN npm run build

# Production image with minimal footprint
FROM base

WORKDIR /myapp

COPY --from=deps /myapp/node_modules /myapp/node_modules
COPY --from=build /myapp/node_modules/.prisma /myapp/node_modules/.prisma
COPY --from=build /myapp/build /myapp/build
COPY --from=build /myapp/public /myapp/public
COPY --from=build /myapp/package.json /myapp/package.json
COPY --from=build /myapp/start.sh /myapp/start.sh
COPY --from=build /myapp/prisma /myapp/prisma
COPY --from=build /myapp/.build-last-commit /myapp/.build-last-commit

# Ensure .git folder is not included in the final image
RUN rm -rf .git

ENTRYPOINT [ "./start.sh" ]
