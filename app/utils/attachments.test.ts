/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect, test } from "vitest";
import { isAttachmentCountAllowed, resolveMaxAttachments } from "./attachments";

test("resolveMaxAttachments uses the hard max for negative values", () => {
  expect(resolveMaxAttachments(-1, 5)).toBe(5);
  expect(resolveMaxAttachments(-99, 5)).toBe(5);
});

test("resolveMaxAttachments clamps values above the hard max", () => {
  expect(resolveMaxAttachments(99, 5)).toBe(5);
  expect(resolveMaxAttachments(5, 5)).toBe(5);
});

test("resolveMaxAttachments keeps values within range", () => {
  expect(resolveMaxAttachments(0, 5)).toBe(0);
  expect(resolveMaxAttachments(1, 5)).toBe(1);
  expect(resolveMaxAttachments(4, 5)).toBe(4);
});

test("isAttachmentCountAllowed allows counts up to the max", () => {
  expect(isAttachmentCountAllowed({ next: 0, current: 0, max: 1 })).toBe(true);
  expect(isAttachmentCountAllowed({ next: 1, current: 0, max: 1 })).toBe(true);
  expect(isAttachmentCountAllowed({ next: 5, current: 0, max: 5 })).toBe(true);
});

test("isAttachmentCountAllowed blocks counts above the max", () => {
  expect(isAttachmentCountAllowed({ next: 2, current: 0, max: 1 })).toBe(false);
  expect(isAttachmentCountAllowed({ next: 1, current: 0, max: 0 })).toBe(false);
});

test("isAttachmentCountAllowed allows items already over the max to stay", () => {
  expect(isAttachmentCountAllowed({ next: 5, current: 5, max: 1 })).toBe(true);
});

test("isAttachmentCountAllowed allows items already over the max to shed", () => {
  expect(isAttachmentCountAllowed({ next: 4, current: 5, max: 1 })).toBe(true);
  expect(isAttachmentCountAllowed({ next: 1, current: 5, max: 1 })).toBe(true);
  expect(isAttachmentCountAllowed({ next: 0, current: 5, max: 1 })).toBe(true);
});

test("isAttachmentCountAllowed blocks items already over the max from gaining", () => {
  expect(isAttachmentCountAllowed({ next: 6, current: 5, max: 1 })).toBe(false);
});
