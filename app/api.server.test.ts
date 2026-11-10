/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// @vitest-environment node

import { beforeEach, expect, test, vi } from "vitest";
import { z } from "zod";

const { logError } = vi.hoisted(() => ({ logError: vi.fn() }));
vi.mock("./shared/monitoring", () => ({ logError }));

import { api, parseJsonBody } from "./api.server";

function post(body?: string) {
  return new Request("http://localhost/api/test", { method: "POST", body });
}

const action = api(async (request: Request) =>
  z.object({ userId: z.string() }).parse(await parseJsonBody(request))
);

async function rejection(promise: Promise<unknown>) {
  const thrown = await promise.then(
    () => undefined,
    (error: unknown) => error
  );
  expect(thrown).toBeInstanceOf(Response);
  return thrown as Response;
}

beforeEach(() => {
  logError.mockClear();
});

test("valid body is parsed", async () => {
  expect(await action(post('{"userId":"1"}'))).toEqual({ userId: "1" });
});

test.each([
  ["empty", undefined],
  ["truncated", '{"userId":'],
  ["non-JSON", "userId=1"]
])("%s body answers 400 without logging", async (_, body) => {
  const response = await rejection(action(post(body)));
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: expect.any(String) });
  expect(logError).not.toHaveBeenCalled();
});

test("body with the wrong shape answers 400 without logging", async () => {
  const response = await rejection(action(post('{"userId":1}')));
  expect(response.status).toBe(400);
  expect(logError).not.toHaveBeenCalled();
});

test("SyntaxError outside body parsing is still logged as a server error", async () => {
  const failing = api(async () => JSON.parse("{"));
  const response = await rejection(failing(undefined));
  expect(response.status).toBe(500);
  expect(logError).toHaveBeenCalledOnce();
});

test("non-syntax body failures are not treated as bad requests", async () => {
  const request = post("{}");
  await request.text();
  await expect(parseJsonBody(request)).rejects.toBeInstanceOf(TypeError);
});
