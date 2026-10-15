/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect, test } from "vitest";
import { errorBoundaryEnglish } from "~/data/error-boundary-english";
import * as languages from "~/translations";

const { english } = languages;

function getPlaceholders(value: string) {
  return [...value.matchAll(/\{(\d+)\}/g)].map(([, index]) => index).sort();
}

test.each(Object.keys(languages).filter((language) => language !== "english"))(
  "%s uses the same interpolation placeholders as english",
  (language) => {
    const translation = languages[language as keyof typeof languages];
    for (const [token, value] of Object.entries(translation)) {
      const expected = english[token as keyof typeof english];
      expect(expected, `'${token}' does not exist in english`).toBeDefined();
      expect(
        getPlaceholders(value),
        `'${token}' placeholders do not match english ('${value}')`
      ).toEqual(getPlaceholders(expected));
    }
  }
);

test("error boundary english fallback matches english", () => {
  for (const [token, value] of Object.entries(errorBoundaryEnglish)) {
    expect(value, `'${token}' differs from english`).toBe(
      english[token as keyof typeof english]
    );
  }
});
