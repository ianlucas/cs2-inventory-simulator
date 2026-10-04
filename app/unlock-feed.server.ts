/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Rarity, CS2UnlockedItem } from "@ianlucas/cs2-lib";
import { EventEmitter } from "node:events";
import {
  consumeRateLimitToken,
  UNLOCK_FEED_RATE_LIMIT
} from "~/models/rate-limit.server";
import { appShowUnlockFeed, inventoryAllowProfile } from "~/models/rule.server";
import { logError } from "~/shared/monitoring";
import { singleton } from "~/singleton.server";
import type { UnlockFeedEvent } from "./unlock-feed";

// Roughly how long the opener's case wheel spins, so nobody sees the drop
// before the opener does.
export const UNLOCK_FEED_PUBLISH_DELAY_MS = 6_500;

type UnlockFeedListener = (event: UnlockFeedEvent) => void;

// In-memory, so only clients connected to the same instance get the event.
export class UnlockFeed {
  private readonly emitter = new EventEmitter().setMaxListeners(0);

  publish(event: UnlockFeedEvent) {
    this.emitter.emit("unlock", event);
  }

  subscribe(listener: UnlockFeedListener) {
    this.emitter.on("unlock", listener);
    return () => {
      this.emitter.off("unlock", listener);
    };
  }
}

export const unlockFeed = singleton("unlockFeed", () => new UnlockFeed());

function toUnlockFeedEvent(
  user: { id: string; name: string },
  unlockedItem: CS2UnlockedItem
): UnlockFeedEvent {
  return {
    itemId: unlockedItem.id,
    statTrak: unlockedItem.attributes.statTrak !== undefined,
    userId: user.id,
    userName: user.name
  };
}

export async function announceUnlockedItem(
  user: { id: string; name: string },
  unlockedItem: CS2UnlockedItem
) {
  try {
    // Immortal items also play the ancient sound, so this covers both.
    if (
      unlockedItem.rarity !== CS2Rarity.Ancient ||
      !(await appShowUnlockFeed.for(user.id).get()) ||
      !(await inventoryAllowProfile.for(user.id).get()) ||
      !(await consumeRateLimitToken(
        `unlock-feed:${user.id}`,
        UNLOCK_FEED_RATE_LIMIT
      ))
    ) {
      return;
    }
    const event = toUnlockFeedEvent(user, unlockedItem);
    setTimeout(() => unlockFeed.publish(event), UNLOCK_FEED_PUBLISH_DELAY_MS);
  } catch (error) {
    logError("Failed to announce unlocked item.", { error });
  }
}
