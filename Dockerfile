FROM node:24-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:24-alpine AS production-dependencies-env
COPY ./package.json package-lock.json prisma /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node:24-alpine AS build-env
ARG SOURCE_COMMIT
ENV SOURCE_COMMIT=$SOURCE_COMMIT
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npx prisma generate
RUN BUILD_SOURCE_MAPS=true npm run build
RUN npx sentry-cli sourcemaps inject build/client/assets >/dev/null \
  && mkdir build/sourcemaps \
  && cp build/client/assets/*.js build/sourcemaps/ \
  && mv build/client/assets/*.map build/sourcemaps/

FROM node:24-alpine
ARG SOURCE_COMMIT
ENV SOURCE_COMMIT=$SOURCE_COMMIT
COPY ./prisma.config.ts ./package.json package-lock.json start.sh /app/
COPY ./scripts/upload-sourcemaps.sh /app/scripts/
COPY ./prisma /app/prisma
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
ENV PORT=3000
EXPOSE 3000
HEALTHCHECK --start-period=40s --interval=10s --timeout=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:${PORT:-3000}/healthz || exit 1
ENTRYPOINT ["./start.sh"]
