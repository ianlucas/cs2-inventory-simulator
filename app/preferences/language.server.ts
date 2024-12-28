/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Session } from "react-router";
import { LanguageName, languageNames, languages } from "~/data/languages";
import { appCountry } from "~/models/rule.server";

export function isValidLanguage(language: unknown): language is LanguageName {
  return languageNames.includes(language as LanguageName);
}

function getLanguageFromCountry(countryCode: string) {
  return (
    languages.find(({ countries }) => {
      return countries.includes(countryCode);
    })?.name ?? "english"
  );
}

function getLangFromLanguage(name: string) {
  return (
    languages.find(({ name: otherName }) => {
      return otherName === name;
    })?.lang ?? "en-US"
  );
}

export async function getLanguage(session: Session, ipCountry: string | null) {
  const country = (ipCountry || (await appCountry.get())).toLowerCase();
  const language =
    (session.get("language") as string | null | undefined) ||
    getLanguageFromCountry(country);
  return {
    lang: getLangFromLanguage(language),
    language
  };
}
