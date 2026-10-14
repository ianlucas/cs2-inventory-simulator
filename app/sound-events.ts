/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface SoundEvent {
  /** Seconds during which further instances are dropped. */
  blockDuration?: number;
  /** Events played alongside this one. */
  children?: string[];
  /** Seconds before the sound starts. */
  delay?: number;
  /** Path under `public/sounds`, mirroring the game's `sounds/` folder. */
  file: string;
  /** Instances allowed at once; past it, the oldest one stops. */
  instanceLimit?: number;
  pitch?: number;
  /** Fetched ahead of time so the first play is instant. */
  preload?: boolean;
  volume?: number;
}

/** An event from CS2's `soundevents/game_sounds_ui.vsndevts`. */
function panorama(
  file: string,
  volume: number,
  event?: Omit<SoundEvent, "file" | "volume">
): SoundEvent {
  return {
    blockDuration: 0.01,
    file: `ui/panorama/${file}`,
    instanceLimit: 1,
    preload: true,
    volume,
    ...event
  };
}

export const SOUND_EVENTS = {
  case_awarded_ancient: { file: "ui/panorama/case_awarded_5_ancient_01.wav" },
  case_awarded_common: { file: "ui/panorama/case_awarded_0_common_01.wav" },
  case_awarded_legendary: {
    file: "ui/panorama/case_awarded_4_legendary_01.wav"
  },
  case_awarded_mythical: {
    file: "ui/panorama/case_awarded_3_mythical_01.wav"
  },
  case_awarded_rare: { file: "ui/panorama/case_awarded_2_rare_01.wav" },
  case_awarded_uncommon: {
    file: "ui/panorama/case_awarded_1_uncommon_01.wav"
  },
  case_drop: { file: "ui/panorama/case_drop_01.wav" },
  case_scroll: { file: "ui/csgo_ui_crate_item_scroll.wav" },
  case_unlock: { file: "ui/panorama/case_unlock_immediate_01.wav" },
  checkbox_toggle: panorama("itemtile_click_02.wav", 0.4),
  generic_button_press: panorama("generic_press_01.wav", 0.3),
  generic_button_rollover: panorama("generic_scroll_01.wav", 0.1, {
    pitch: 1.4
  }),
  inventory_inspect_close: panorama("inventory_item_close_01.wav", 0.15, {
    delay: 0.1
  }),
  inventory_item_close: { file: "ui/panorama/inventory_item_close_01.wav" },
  inventory_item_pickup: { file: "ui/panorama/inventory_item_pickup_01.wav" },
  inventory_item_popupSelect: panorama("itemtile_click_02.wav", 0.6),
  inventory_item_putdown: { file: "ui/panorama/inventory_item_putdown_01.wav" },
  inventory_item_rollover: panorama("itemtile_plastic_rollover_15.wav", 0.2),
  inventory_item_select: panorama("inventory_item_select_01.wav", 0.6),
  inventory_new_item_accept: {
    file: "ui/panorama/inventory_new_item_accept_01.wav"
  },
  laptop_button_fill_loop: { file: "ui/laptop_button_fill_loop_01.wav" },
  mainmenu_rollover: panorama("mainmenu_rollover_01.wav", 0.1),
  music_equip: { file: "ui/panorama/music_equip_01.wav" },
  sidemenu_rollover: panorama("sidemenu_rollover_02.wav", 0.4),
  sidemenu_select: panorama("sidemenu_click_01.wav", 0.2),
  sticker_apply: { file: "ui/sticker_apply.wav" },
  sticker_apply_confirm: { file: "ui/item_sticker_apply_confirm.wav" },
  sticker_scratch1: { file: "ui/sticker_scratch1.wav" },
  sticker_scratch2: { file: "ui/sticker_scratch2.wav" },
  sticker_scratch3: { file: "ui/sticker_scratch3.wav" },
  sticker_scratch4: { file: "ui/sticker_scratch4.wav" },
  sticker_scratch5: { file: "ui/sticker_scratch5.wav" },
  submenu_dropdown_option_rollover: panorama(
    "submenu_dropdown_rollover_01.wav",
    0.1
  ),
  submenu_dropdown_option_select: panorama(
    "submenu_dropdown_option_select_01.wav",
    0.4
  ),
  submenu_dropdown_select: panorama("submenu_dropdown_select_01.wav", 0.3),
  submenu_leveloptions_slidein: panorama(
    "submenu_leveloptions_slidein_01.wav",
    0.1,
    { delay: 0.1 }
  ),
  submenu_rollover: panorama("submenu_scroll_01.wav", 0.1),
  submenu_select: panorama("submenu_select_01.wav", 0.3, {
    blockDuration: 0.1,
    children: ["inventory_inspect_close", "submenu_leveloptions_slidein"],
    pitch: 1.2
  }),
  tab_mainmenu_inventory: panorama("mainmenu_press_inventory_02.wav", 0.2),
  tab_mainmenu_loadout: panorama("mainmenu_press_loadout_01.wav", 0.2),
  tab_mainmenu_shop: panorama("mainmenu_press_shop_01.wav", 0.25),
  tab_settings_settings: panorama("mainmenu_press_settings_02.wav", 0.2, {
    children: ["submenu_leveloptions_slidein"]
  })
} satisfies Record<string, SoundEvent>;

export type SoundName = keyof typeof SOUND_EVENTS;

export function isSoundName(value: string): value is SoundName {
  return Object.hasOwn(SOUND_EVENTS, value);
}
