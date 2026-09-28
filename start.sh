#!/bin/sh -ex

npx prisma migrate deploy
./scripts/upload-sourcemaps.sh &
npm run start
