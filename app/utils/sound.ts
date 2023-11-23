/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { range } from "./number";

let sounds: HTMLAudioElement[] = [];
let index = 0;
export function playSound(src: string) {
  if (sounds.length === 0) {
    sounds = range(8).map(() => new Audio());
  }
  sounds[index].pause();
  sounds[index].currentTime = 0;
  sounds[index] = new Audio(src);
  sounds[index].play();
  index += 1;
  if (!sounds[index]) {
    index = 0;
  }
}
