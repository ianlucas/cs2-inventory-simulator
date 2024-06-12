/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const languages = [
  { name: "brazilian" as const, countries: ["br"], lang: "pt-BR" },
  { name: "bulgarian" as const, countries: ["bg"], lang: "bg-BG" },
  { name: "czech" as const, countries: ["cz"], lang: "cs-CZ" },
  { name: "danish" as const, countries: ["dk"], lang: "da-DK" },
  { name: "dutch" as const, countries: ["nl"], lang: "nl-NL" },
  { name: "english" as const, countries: ["us"], lang: "en-US" },
  { name: "finnish" as const, countries: ["fi"], lang: "fi-FI" },
  { name: "french" as const, countries: ["fr"], lang: "fr-FR" },
  { name: "german" as const, countries: ["de"], lang: "de-DE" },
  { name: "greek" as const, countries: ["gr"], lang: "el-GR" },
  { name: "hungarian" as const, countries: ["hu"], lang: "hu-HU" },
  { name: "indonesian" as const, countries: ["id"], lang: "id-ID" },
  { name: "italian" as const, countries: ["it"], lang: "it-IT" },
  { name: "japanese" as const, countries: ["jp"], lang: "ja-JP" },
  { name: "koreana" as const, countries: ["kr"], lang: "ko-KR" },
  { name: "latam" as const, countries: ["ar"], lang: "es-AR" },
  { name: "norwegian" as const, countries: ["no"], lang: "nb-NO" },
  { name: "polish" as const, countries: ["pl"], lang: "pl-PL" },
  { name: "portuguese" as const, countries: ["pt"], lang: "pt-PT" },
  { name: "romanian" as const, countries: ["ro"], lang: "ro-RO" },
  { name: "russian" as const, countries: ["ru"], lang: "ru-RU" },
  { name: "schinese" as const, countries: ["cn"], lang: "zh-CN" },
  { name: "spanish" as const, countries: ["es"], lang: "es-ES" },
  { name: "swedish" as const, countries: ["se"], lang: "sv-SE" },
  { name: "tchinese" as const, countries: ["tw"], lang: "zh-TW" },
  { name: "thai" as const, countries: ["th"], lang: "th-TH" },
  { name: "turkish" as const, countries: ["tr"], lang: "tr-TR" },
  { name: "ukrainian" as const, countries: ["ua"], lang: "uk-UA" },
  { name: "vietnamese" as const, countries: ["vn"], lang: "vi-VN" }
];

export const languageNames = languages.map(({ name }) => name);
export type LanguageName = (typeof languageNames)[number];
