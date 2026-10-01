/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export type TranslationKind = "item" | "ui";

export function getTranslationFileName(
  kind: TranslationKind,
  language: string,
  hash: string,
  extension = "json"
) {
  return `${kind}.${language}.${hash}.${extension}`;
}

export function parseTranslationFileName(fileName: string) {
  const match = fileName.match(/^(item|ui)\.([a-z]+)\.[0-9a-f]+\.json$/);
  return match !== null
    ? { kind: match[1] as TranslationKind, language: match[2] }
    : undefined;
}
