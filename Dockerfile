FROM node:22-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci && npx prisma generate

FROM node:22-alpine AS production-dependencies-env
COPY ./package.json package-lock.json prisma /app/
WORKDIR /app
RUN npm ci --omit=dev && npx prisma generate

FROM node:22-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM node:22-alpine
COPY ./package.json package-lock.json start.sh prisma /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
ENTRYPOINT ["./start.sh"]
