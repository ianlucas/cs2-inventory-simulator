#!/bin/sh -ex

npx prisma migrate deploy
./scripts/upload-sourcemaps.sh &
exec node ./build/server/index.js
