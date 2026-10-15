/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2ItemType, CS2RarityColor } from "@ianlucas/cs2-lib";
import { afterEach, describe, expect, it } from "vitest";
import { buildViewerSrc, VIEWER_AGENT_IDLE_CLIP } from "./viewer";
import { ViewerApi } from "./viewer-api.client";

CS2Economy.load({
  items: [
    { id: 5, type: CS2ItemType.Weapon, rarityColor: CS2RarityColor.Common },
    { id: 80, type: CS2ItemType.Agent, rarityColor: CS2RarityColor.Common }
  ]
});

const apis: ViewerApi[] = [];

function attach(options?: Parameters<typeof buildViewerSrc>[1]) {
  const iframe = document.createElement("iframe");
  iframe.src = buildViewerSrc({ id: 5 }, options);
  const api = new ViewerApi(iframe);
  apis.push(api);
  return api;
}

afterEach(() => {
  apis.splice(0).forEach((api) => api.destroy());
});

describe("ViewerApi.setItem", () => {
  it("sends an agent with its idle", () => {
    const api = attach();
    api.setItem({ id: 80 });
    expect(api.item).toEqual({ id: 80, clip: VIEWER_AGENT_IDLE_CLIP });
  });

  it("sends an agent still to an icon or capture viewer", () => {
    for (const options of [{ icon: true }, { capture: true }]) {
      const api = attach(options);
      api.setItem({ id: 80 });
      expect(api.item).toEqual({ id: 80 });
    }
  });
});
