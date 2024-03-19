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
  { name: "brazilian", countries: ["br"], lang: "pt-BR" },
  { name: "bulgarian", countries: ["bg"], lang: "bg-BG" },
  { name: "czech", countries: ["cz"], lang: "cs-CZ" },
  { name: "danish", countries: ["dk"], lang: "da-DK" },
  { name: "dutch", countries: ["nl"], lang: "nl-NL" },
  { name: "english", countries: ["us"], lang: "en-US" },
  { name: "finnish", countries: ["fi"], lang: "fi-FI" },
  { name: "french", countries: ["fr"], lang: "fr-FR" },
  { name: "german", countries: ["de"], lang: "de-DE" },
  { name: "greek", countries: ["gr"], lang: "el-GR" },
  { name: "hungarian", countries: ["hu"], lang: "hu-HU" },
  { name: "italian", countries: ["it"], lang: "it-IT" },
  { name: "japanese", countries: ["jp"], lang: "ja-JP" },
  { name: "koreana", countries: ["kr"], lang: "ko-KR" },
  { name: "latam", countries: ["ar"], lang: "es-AR" },
  { name: "norwegian", countries: ["no"], lang: "nb-NO" },
  { name: "polish", countries: ["pl"], lang: "pl-PL" },
  { name: "portuguese", countries: ["pt"], lang: "pt-PT" },
  { name: "romanian", countries: ["ro"], lang: "ro-RO" },
  { name: "russian", countries: ["ru"], lang: "ru-RU" },
  { name: "schinese", countries: ["cn"], lang: "zh-CN" },
  { name: "spanish", countries: ["es"], lang: "es-ES" },
  { name: "swedish", countries: ["se"], lang: "sv-SE" },
  { name: "tchinese", countries: ["tw"], lang: "zh-TW" },
  { name: "thai", countries: ["th"], lang: "th-TH" },
  { name: "turkish", countries: ["tr"], lang: "tr-TR" },
  { name: "ukrainian", countries: ["ua"], lang: "uk-UA" },
  { name: "vietnamese", countries: ["vn"], lang: "vi-VN" }
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
  const country = (ipCountry || "us").toLowerCase();
  const language = session.get("language") || getLanguageFromCountry(country);
  return {
    itemTranslation: readItemTranslation(language),
    lang: getLangFromLanguage(language),
    language,
    translation: translations[language] ?? translations.english
  };
}
