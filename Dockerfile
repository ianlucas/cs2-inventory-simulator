# Adapted from Remix's Indie Stack
FROM node:18-bullseye-slim AS base

ENV NODE_ENV=production

# Install system dependencies
RUN apt-get update && apt-get install -y openssl git

# Install dependencies
FROM base AS deps

WORKDIR /myapp
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# Generate Prisma client, add commit hash, and build the app
FROM deps AS build

ARG SOURCE_COMMIT
ENV SOURCE_COMMIT=${SOURCE_COMMIT}

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN if [ -d .git ]; then \
      git log -n 1 --pretty=format:%H > .build-last-commit; \
    elif [ -n "$SOURCE_COMMIT" ] && [ "$SOURCE_COMMIT" != "unknown" ]; then \
      echo "$SOURCE_COMMIT" > .build-last-commit; \
    fi
RUN npm run build
RUN rm -rf .git

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

ENTRYPOINT [ "./start.sh" ]
