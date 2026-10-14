/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { isSoundName, SOUND_EVENTS, SoundEvent } from "./sound-events";

const SOUNDS_DIRECTORY = join(process.cwd(), "public/sounds");

const events = Object.entries<SoundEvent>(SOUND_EVENTS);

describe("SOUND_EVENTS", () => {
  test("points every event at a file in public/sounds", () => {
    for (const [, { file }] of events) {
      expect(existsSync(join(SOUNDS_DIRECTORY, file)), file).toBe(true);
    }
  });

  test("uses every file in public/sounds", () => {
    const used = new Set(events.map(([, { file }]) => file));
    const files = readdirSync(SOUNDS_DIRECTORY, { recursive: true })
      .map(String)
      .filter((file) => file.endsWith(".wav"));
    expect(files.filter((file) => !used.has(file))).toEqual([]);
  });

  test("only layers registered events", () => {
    for (const [name, { children }] of events) {
      for (const child of children ?? []) {
        expect(isSoundName(child), `${name} -> ${child}`).toBe(true);
      }
    }
  });

  // From CS2's `soundevents/game_sounds_ui.vsndevts`.
  test.each([
    ["checkbox_toggle", 0.4, 1, 0.01, 0],
    ["generic_button_press", 0.3, 1, 0.01, 0],
    ["generic_button_rollover", 0.1, 1.4, 0.01, 0],
    ["inventory_inspect_close", 0.15, 1, 0.01, 0.1],
    ["inventory_item_popupSelect", 0.6, 1, 0.01, 0],
    ["inventory_item_rollover", 0.2, 1, 0.01, 0],
    ["inventory_item_select", 0.6, 1, 0.01, 0],
    ["mainmenu_rollover", 0.1, 1, 0.01, 0],
    ["sidemenu_rollover", 0.4, 1, 0.01, 0],
    ["sidemenu_select", 0.2, 1, 0.01, 0],
    ["submenu_dropdown_option_rollover", 0.1, 1, 0.01, 0],
    ["submenu_dropdown_option_select", 0.4, 1, 0.01, 0],
    ["submenu_dropdown_select", 0.3, 1, 0.01, 0],
    ["submenu_leveloptions_slidein", 0.1, 1, 0.01, 0.1],
    ["submenu_rollover", 0.1, 1, 0.01, 0],
    ["submenu_select", 0.3, 1.2, 0.1, 0],
    ["tab_mainmenu_inventory", 0.2, 1, 0.01, 0],
    ["tab_mainmenu_loadout", 0.2, 1, 0.01, 0],
    ["tab_mainmenu_shop", 0.25, 1, 0.01, 0],
    ["tab_settings_settings", 0.2, 1, 0.01, 0]
  ] as const)(
    "matches the game for %s",
    (name, volume, pitch, blockDuration, delay) => {
      const event: SoundEvent = SOUND_EVENTS[name];
      expect(event.volume).toBe(volume);
      expect(event.pitch ?? 1).toBe(pitch);
      expect(event.blockDuration).toBe(blockDuration);
      expect(event.delay ?? 0).toBe(delay);
      expect(event.instanceLimit).toBe(1);
      expect(event.preload).toBe(true);
    }
  );
});
