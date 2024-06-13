/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { range } from "./number";

let sounds: HTMLAudioElement[] = [];
let index = 0;
export function playSound(
  src:
    | "buttonclick"
    | "case_awarded_ancient"
    | "case_awarded_common"
    | "case_awarded_legendary"
    | "case_awarded_mythical"
    | "case_awarded_rare"
    | "case_awarded_uncommon"
    | "case_drop"
    | "case_scroll"
    | "case_unlock"
    | "inventory_item_close"
    | "inventory_item_pickup"
    | "inventory_item_putdown"
    | "inventory_new_item_accept"
    | "music_equip"
    | "roll"
    | "sticker_apply_confirm"
    | "sticker_apply"
    | "sticker_scratch1"
    | "sticker_scratch2"
    | "sticker_scratch3"
    | "sticker_scratch4"
    | "sticker_scratch5"
) {
  if (sounds.length === 0) {
    sounds = range(8).map(() => new Audio());
  }
  sounds[index].pause();
  sounds[index] = new Audio(`/sounds/${src}.wav`);
  sounds[index].play();
  index += 1;
  if (!sounds[index]) {
    index = 0;
  }
}
