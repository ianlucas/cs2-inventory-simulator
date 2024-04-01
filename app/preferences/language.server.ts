/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Session } from "@remix-run/node";

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

export function isValidLanguage(language: string) {
  return getAllowedLanguages().includes(language);
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
  const language =
    (session.get("language") as string | null | undefined) ||
    getLanguageFromCountry(country);
  return {
    lang: getLangFromLanguage(language),
    language
  };
}
