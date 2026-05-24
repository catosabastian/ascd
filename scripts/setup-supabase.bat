#!/usr/bin/env bash
npm install @prisma/client
npx prisma generate
npx prisma db push --accept-data-loss
