/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { beforeEach, describe, expect, test } from "vitest";
import {
  resolveHoverSounds,
  resolveKeyPressSound,
  resolvePressSound
} from "./interface-sounds";

function render(html: string) {
  document.body.innerHTML = html;
}

function get(id: string) {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`Missing #${id}.`);
  }
  return element;
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("resolveHoverSounds", () => {
  test("plays the generic rollover on a button", () => {
    render(`<button id="button"><span id="label">Equip</span></button>`);
    expect(resolveHoverSounds(get("label"), null)).toEqual([
      "generic_button_rollover"
    ]);
  });

  test("prefers a declared sound over the default", () => {
    render(`<button id="button" data-sound-hover="submenu_rollover"></button>`);
    expect(resolveHoverSounds(get("button"), null)).toEqual([
      "submenu_rollover"
    ]);
  });

  test("keeps links silent unless they declare a sound", () => {
    render(`
      <a id="plain" href="/"></a>
      <a id="nav" href="/" data-sound-hover="mainmenu_rollover"></a>
    `);
    expect(resolveHoverSounds(get("plain"), null)).toEqual([]);
    expect(resolveHoverSounds(get("nav"), null)).toEqual(["mainmenu_rollover"]);
  });

  test("keeps opted-out, unknown and disabled elements silent", () => {
    render(`
      <button id="none" data-sound-hover="none"></button>
      <button id="unknown" data-sound-hover="not_a_sound"></button>
      <button id="disabled" disabled></button>
    `);
    expect(resolveHoverSounds(get("none"), null)).toEqual([]);
    expect(resolveHoverSounds(get("unknown"), null)).toEqual([]);
    expect(resolveHoverSounds(get("disabled"), null)).toEqual([]);
  });

  test("does not replay while moving inside the same element", () => {
    render(`<button><span id="icon"></span><span id="label"></span></button>`);
    expect(resolveHoverSounds(get("label"), get("icon"))).toEqual([]);
  });

  test("plays a tile once, whichever part the pointer enters", () => {
    render(`
      <div id="outside"></div>
      <div data-sound-hover="inventory_item_rollover">
        <button id="overlay" data-sound-hover="none"></button>
        <div id="name"></div>
      </div>
    `);
    expect(resolveHoverSounds(get("overlay"), get("outside"))).toEqual([
      "inventory_item_rollover"
    ]);
    expect(resolveHoverSounds(get("name"), get("overlay"))).toEqual([]);
  });

  test("plays a nested button without replaying its hovered parent", () => {
    render(`
      <div id="tile" data-sound-hover="inventory_item_rollover">
        <button id="button"></button>
      </div>
    `);
    expect(resolveHoverSounds(get("button"), get("tile"))).toEqual([
      "generic_button_rollover"
    ]);
    expect(resolveHoverSounds(get("tile"), get("button"))).toEqual([]);
  });
});

describe("resolvePressSound", () => {
  test("plays the generic press on buttons and links", () => {
    render(`
      <button id="button"><span id="label"></span></button>
      <a id="link" href="/"></a>
      <a id="anchor"></a>
    `);
    expect(resolvePressSound(get("label"))).toBe("generic_button_press");
    expect(resolvePressSound(get("link"))).toBe("generic_button_press");
    expect(resolvePressSound(get("anchor"))).toBeUndefined();
  });

  test("uses the nearest element that declares a sound", () => {
    render(`
      <div data-sound-press="checkbox_toggle">
        <label><span id="track"></span></label>
      </div>
    `);
    expect(resolvePressSound(get("track"))).toBe("checkbox_toggle");
  });

  test("keeps opted-out and disabled buttons silent", () => {
    render(`
      <div data-sound-press="submenu_select">
        <button id="none" data-sound-press="none"></button>
      </div>
      <button id="disabled" disabled></button>
    `);
    expect(resolvePressSound(get("none"))).toBeUndefined();
    expect(resolvePressSound(get("disabled"))).toBeUndefined();
  });

  test("ignores elements that aren't pressable", () => {
    render(`<div id="text"></div>`);
    expect(resolvePressSound(get("text"))).toBeUndefined();
  });
});

describe("resolveKeyPressSound", () => {
  test("plays on the keys that activate each element", () => {
    render(`
      <button id="button"></button>
      <a id="link" href="/"></a>
      <div data-sound-press="checkbox_toggle">
        <input id="toggle" type="checkbox" />
      </div>
    `);
    expect(resolveKeyPressSound(get("button"), "Enter")).toBe(
      "generic_button_press"
    );
    expect(resolveKeyPressSound(get("button"), " ")).toBe(
      "generic_button_press"
    );
    expect(resolveKeyPressSound(get("button"), "a")).toBeUndefined();
    expect(resolveKeyPressSound(get("link"), "Enter")).toBe(
      "generic_button_press"
    );
    expect(resolveKeyPressSound(get("link"), " ")).toBeUndefined();
    expect(resolveKeyPressSound(get("toggle"), " ")).toBe("checkbox_toggle");
    expect(resolveKeyPressSound(get("toggle"), "Enter")).toBeUndefined();
  });
});
