/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Session } from "@remix-run/node";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { z } from "zod";
import { brazilian } from "../translations/brazilian";
import { english } from "../translations/english";
import { CS_ItemTranslations } from "@ianlucas/cslib";

const translations: Record<string, Record<string, string>> = {
  brazilian,
  english
};

const itemTranslations: CS_ItemTranslations = {};

export const languages = [
  { name: "brazilian", countries: ["br"] },
  { name: "bulgarian", countries: ["bg"] },
  { name: "czech", countries: ["cz"] },
  { name: "danish", countries: ["dk"] },
  { name: "dutch", countries: ["nl"] },
  { name: "english", countries: ["us"] },
  { name: "finnish", countries: ["fi"] },
  { name: "french", countries: ["fr"] },
  { name: "german", countries: ["de"] },
  { name: "greek", countries: ["gr"] },
  { name: "hungarian", countries: ["hu"] },
  { name: "italian", countries: ["it"] },
  { name: "japanese", countries: ["jp"] },
  { name: "koreana", countries: ["kr"] },
  { name: "latam", countries: ["ar"] },
  { name: "norwegian", countries: ["no"] },
  { name: "polish", countries: ["pl"] },
  { name: "portuguese", countries: ["pt"] },
  { name: "romanian", countries: ["ro"] },
  { name: "russian", countries: ["ru"] },
  { name: "schinese", countries: ["cn"] },
  { name: "spanish", countries: ["es"] },
  { name: "swedish", countries: ["se"] },
  { name: "tchinese", countries: ["tw"] },
  { name: "thai", countries: ["th"] },
  { name: "turkish", countries: ["tr"] },
  { name: "ukrainian", countries: ["ua"] },
  { name: "vietnamese", countries: ["vn"] }
];

export function getAllowedLanguages() {
  return languages.map(({ name }) => name);
}

function readItemTranslation(language: string) {
  if (itemTranslations[language]) {
    return itemTranslations[language];
  }
  const path = resolve(
    process.cwd(),
    `node_modules/@ianlucas/cslib/assets/translations/items-${language}.json`
  );
  itemTranslations[language] = existsSync(path)
    ? z
        .record(z.record(z.string()))
        .parse(JSON.parse(readFileSync(path, "utf-8")))
    : {};
  return itemTranslations[language];
}

function getCountryLanguage(countryCode: string) {
  return (
    languages.find(({ countries }) => {
      return countries.includes(countryCode);
    })?.name ?? "english"
  );
}

export async function getLanguage(session: Session, ipCountry: string | null) {
  const country = ipCountry || "us";
  const language =
    session.get("language") || getCountryLanguage(country.toLowerCase());
  return {
    itemTranslation: readItemTranslation(language),
    language,
    translation: translations[language] ?? translations.english
  };
}
