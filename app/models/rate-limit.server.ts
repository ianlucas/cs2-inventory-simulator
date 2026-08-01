/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { prisma } from "~/db.server";

export interface RateLimit {
  capacity: number;
  refillIntervalSeconds: number;
}

export const STATTRAK_INCREMENT_RATE_LIMIT: RateLimit = {
  capacity: 50,
  refillIntervalSeconds: 3.6
};

export const SPRAY_CONSUME_RATE_LIMIT: RateLimit = {
  capacity: 1,
  refillIntervalSeconds: 30
};

export function refillAndConsume(
  tokens: number,
  elapsedSeconds: number,
  { capacity, refillIntervalSeconds }: RateLimit
) {
  const refilled = Math.min(
    capacity,
    tokens + elapsedSeconds / refillIntervalSeconds
  );
  return refilled >= 1
    ? { consumed: true, tokens: refilled - 1 }
    : { consumed: false, tokens: refilled };
}

export async function consumeRateLimitToken(key: string, rateLimit: RateLimit) {
  return await prisma.$transaction(async (tx) => {
    await tx.rateLimitBucket.createMany({
      data: { key, tokens: rateLimit.capacity, updatedAt: new Date() },
      skipDuplicates: true
    });
    const [bucket] = await tx.$queryRaw<{ tokens: number; updatedAt: Date }[]>`
      SELECT "tokens", "updatedAt" FROM "RateLimitBucket" WHERE "key" = ${key} FOR UPDATE`;
    const now = new Date();
    const { consumed, tokens } = refillAndConsume(
      bucket.tokens,
      (now.getTime() - bucket.updatedAt.getTime()) / 1000,
      rateLimit
    );
    await tx.rateLimitBucket.update({
      data: { tokens, updatedAt: now },
      where: { key }
    });
    return consumed;
  });
}
