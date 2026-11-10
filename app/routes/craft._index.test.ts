/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ensure } from "@ianlucas/cs2-lib";
import { expect, test, vi } from "vitest";
import { getInventoryItemShareUrl } from "~/inventory.client";
import { createFakeInventoryItemFromBase } from "~/shared/inventory";
import { loadEconomy } from "~/test-utils";
import { loader } from "./craft._index";

const owner = { avatar: "avatar.jpg", id: "76561198000000000", name: "Owner" };

vi.mock("~/middleware.server", () => ({ middleware: vi.fn() }));
vi.mock("~/models/rule.server", () => ({
  inventoryAllowProfile: { for: () => ({ get: async () => true }) }
}));
vi.mock("~/models/user.server", () => ({
  getUserBasicData: async (userId: string) =>
    userId === owner.id ? owner : undefined
}));

loadEconomy();

const AK47_ID = 4;

async function load(url: string) {
  const args = { request: new Request(url) } as Parameters<typeof loader>[0];
  try {
    return await loader(args);
  } catch (thrown) {
    return thrown;
  }
}

test("a share link loads the shared item and its owner", async () => {
  const url = getInventoryItemShareUrl(
    createFakeInventoryItemFromBase({ id: AK47_ID, nameTag: "my rifle" }),
    owner.id
  );
  expect(await load(url)).toMatchObject({
    data: {
      shared: {
        item: { id: AK47_ID, nameTag: "my rifle" },
        user: owner,
        userHasProfile: true
      }
    }
  });
});

test("the craft page loads without a share link", async () => {
  expect(await load("http://localhost/craft")).toMatchObject({
    data: { shared: undefined, uid: undefined }
  });
});

test("a damaged share link redirects to the craft page with an alert", async () => {
  const url = new URL(
    getInventoryItemShareUrl(createFakeInventoryItemFromBase({ id: AK47_ID }))
  );
  const share = ensure(url.searchParams.get("share"));
  for (const damaged of [
    share.slice(0, -3),
    share.slice(2),
    `${share.slice(0, 4)}Zq${share.slice(6)}`
  ]) {
    url.searchParams.set("share", damaged);
    const response = await load(url.href);
    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(302);
    expect((response as Response).headers.get("Location")).toBe(
      "/craft?error=InvalidShareLink"
    );
  }
});
