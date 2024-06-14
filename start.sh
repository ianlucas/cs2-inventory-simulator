#!/bin/sh -ex

npx prisma migrate deploy
npm run start