/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_parseValveKeyValue } from "@ianlucas/cs2-lib";
import { fail } from "assert";
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { CS2_CSGO_PATH } from "~/env.server";
import { assert } from "~/utils/misc";

function replace(
  str: string,
  searchValue: string | RegExp,
  replaceValue: string
) {
  const replaced = str.replace(searchValue, replaceValue);
  if (str === replaced) {
    fail(
      `Failed to replace '${searchValue}' with '${replaceValue}' for '${str}'`
    );
  }
  return replaced;
}

// prettier-ignore
const STRINGS_FROM_GAME: Record<string, string | string[] | {
  token: string;
  transform: (value: string, lang: string) => string;
}> = {
  ApplyStickerCancel: "Cancel_Button",
  ApplyStickerUse: "popup_can_stick_title_sticker",
  ApplyStickerUseOn: { token: "popup_can_stick_desc", transform: (value) => replace(value, /<b>\s?\{s:tool_target_name\}\<\/b>/, '') },
  ApplyStickerWarn: "SFUI_InvUse_Warning_use_can_stick_sticker",
  CaseAdd: "Button_Add",
  CaseClose: "GameUI_Close",
  CaseContainsOne: "Econ_Revolving_Loot_List",
  CaseNeed: { token: "popup_capability_upsell", transform: (value) => replace(value, '<b>{s:itemname}</b>', '') },
  CaseOnceWarn: "popup_decodeable_warning",
  CaseRareItem: "Exceedingly_Rare_Item",
  CaseUnlock: { token: "popup_decodeable_desc", transform: (value) => replace(value, '<b>{s:itemname}</b>', '') },
  CaseUnlockContainer: "popup_decodeable_title",
  CaseUse: { token: "popup_decodeable_async_desc", transform: (value) => replace(value, '<b>{s:itemname}</b>', '') },
  CategoryAgent: "Type_CustomPlayer",
  CategoryCase: "CSGO_Type_WeaponCase",
  CategoryCollectible: "CSGO_Type_Collectible",
  CategoryEquipment: "CSGO_Type_Equipment",
  CategoryGlove: "Type_Hands",
  CategoryGraffiti: "CSGO_Type_Spray",
  CategoryHeavy: "CSGO_Inventory_Weapon_Category_Heavy",
  CategoryKey: "CSGO_Tool_WeaponCase_KeyTag",
  CategoryKnife: "CSGO_Type_Knife",
  CategoryMusicKit: "CSGO_Type_MusicKit",
  CategoryPatch: "CSGO_Tool_Patch",
  CategoryPistol: "CSGO_Type_Pistol",
  CategoryRifle: "CSGO_Type_Rifle",
  CategorySMG: "CSGO_Type_SMG",
  CategorySticker: "CSGO_Tool_Sticker",
  CategoryTool: "CSGO_Type_Tool",
  EditorCancel: "Cancel_Button",
  EditorNametag: "ToolType_name",
  EditorQuantity: "op_store_column_title_quantity",
  EditorRandom: "SFUI_Map_random",
  EditorReset: "settings_reset",
  EditorSave: "GameUI_Save",
  EditorSeed: "Workshop_Preview_Pattern",
  EditorStatTrak: "CSGO_KillEater_Hud",
  EditorStickers: "Inv_Category_sticker",
  EditorWear: "Workshop_Preview_Wear",
  InspectClose: "GameUI_Close",
  InventoryApplySticker: "SFUI_InvUse_Use_Sticker",
  InventoryFilterAgents: "LoadoutSlot_customplayer",
  InventoryFilterAll: "Inv_Category_any",
  InventoryFilterAllEquipment: "inv_nav_weapons_all",
  InventoryFilterAllGraphicArt: "inv_nav_graphics_all",
  InventoryFilterAlphabetical: "inv_sort_alpha",
  InventoryFilterCollection: "inv_sort_collection",
  InventoryFilterContainers: "inv_nav_containers",
  InventoryFilterDisplay: "inv_nav_display",
  InventoryFilterEquipment: "inv_nav_equipment",
  InventoryFilterEquipped: "inv_sort_equipped",
  InventoryFilterEverything: "inv_nav_all",
  InventoryFilterGloves: "LoadoutSlot_clothing_hands",
  InventoryFilterGraffiti: "inv_nav_sprays",
  InventoryFilterGraffitiBoxes: "Inv_Category_graffitibox",
  InventoryFilterGraphicArt: "inv_nav_graphics",
  InventoryFilterMedals: "Inv_Category_flair0",
  InventoryFilterMelee: "LoadoutSlot_Melee",
  InventoryFilterMidTier: "LoadoutSlot_SMG",
  InventoryFilterMisc: "LoadoutSlot_Misc",
  InventoryFilterMusicKits: "inv_nav_musickit",
  InventoryFilterNewest: "inv_sort_age",
  InventoryFilterPatches: "inv_nav_patches",
  InventoryFilterPistols: "LoadoutSlot_Secondary",
  InventoryFilterQuality: "inv_sort_rarity",
  InventoryFilterRifles: "LoadoutSlot_Rifle",
  InventoryFilterSearch: "inv_search_default",
  InventoryFilterSouvenirCases: "Inv_Category_souvenircase",
  InventoryFilterStickerCapsules: "Inv_Category_stickercapsule",
  InventoryFilterStickers: "inv_nav_stickers",
  InventoryFilterTools: "inv_nav_tools",
  InventoryFilterType: "inv_sort_type",
  InventoryFilterWeaponCases: "Inv_Category_weaponcase",
  InventoryItemContainsOne: "Econ_Revolving_Loot_List",
  InventoryItemDelete: "Button_Delete",
  InventoryItemEdit: "Button_Edit_nodots",
  InventoryItemEquip: "CSGOEcon_Equip",
  InventoryItemExterior: "inv_header_grade",
  InventoryItemInspect: "inv_context_preview",
  InventoryItemInspectFinishCatalog: "SFUI_ItemInfo_FinishCatalog",
  InventoryItemInspectPatternTemplate: "SFUI_ItemInfo_PatternTemplate",
  InventoryItemInspectWearRating: "SFUI_ItemInfo_WearAmount",
  InventoryItemMVPStatTrakCount: ["#KillEaterEventType_OCMVPs", ":"],
  InventoryItemNew: "inv_session_prop_recent",
  InventoryItemRareItem: "Econ_Revolving_Loot_List_Rare_Item",
  InventoryItemRarity: "inv_header_rarity",
  InventoryItemRename: { token: "RT_Rn_A", transform: (value) => replace(value, '%s1', '') },
  InventoryItemRenameStorageUnit: "inv_context_yourcasket",
  InventoryItemStatTrak: "CSGO_KillEater_Hud",
  InventoryItemStatTrakCount: ["#KillEaterEventType_Kills", ":"],
  InventoryItemStatTrakDesc: "Attrib_KillEater",
  InventoryItemStorageUnitDeposit: "inv_context_bulkstore",
  InventoryItemStorageUnitEmptyBody: { token: "popup_casket_message_error_casket_empty", transform: (value, lang) => lang === 'finnish' ? replace(value, 'tuhat', '{1}') : replace(value, /1.?000/, '{1}')},
  InventoryItemStorageUnitEmptyClose: "OK",
  InventoryItemStorageUnitEmptyTitle: "popup_casket_title_error_casket_empty",
  InventoryItemStorageUnitInspect: "inv_context_preview",
  InventoryItemStorageUnitRetrieve: "inv_context_bulkretrieve",
  InventoryItemSwapStatTrak: "SFUI_InvContextMenu_can_stattrack_swap",
  InventoryItemTeam: "inv_header_team",
  InventoryItemTeamAny: "CSGO_Inventory_Team_Any",
  InventoryItemTeamCT: "CSGO_Inventory_Team_CT",
  InventoryItemTeamT: "CSGO_Inventory_Team_T",
  InventoryItemUnequip: "SFUI_InvContextMenu_Unequip",
  InventoryItemUnlockContainer: "inv_context_open_package",
  InventoryItemUseStorageUnit: "inv_context_newcasket",
  InventoryScrapeSticker: "popup_remove_sticker_button",
  InventorySelectAnItem: "inv_select_item_use",
  InventorySelectInspectContents: "inv_select_casketcontents",
  InventorySelectItemToDeposit: "inv_select_casketstore",
  InventorySelectItemToRetrieve: "inv_select_casketretrieve",
  ItemRarityAncient: "Rarity_Ancient",
  ItemRarityCommon: "Rarity_Common",
  ItemRarityDefault: "Rarity_Default",
  ItemRarityImmortal: "Rarity_Contraband",
  ItemRarityLegendary: "Rarity_Legendary",
  ItemRarityMythical: "Rarity_Mythical",
  ItemRarityNameAgent: "Type_CustomPlayer",
  ItemRarityNameCollectible: "CSGO_Type_Collectible",
  ItemRarityNameContainer: "CSGO_Type_WeaponCase",
  ItemRarityNameContract: "CSGO_Type_Recipe",
  ItemRarityNameEquipment: "CSGO_Type_Equipment",
  ItemRarityNameGloves: "Type_Hands",
  ItemRarityNameGraffiti: "CSGO_Type_Spray",
  ItemRarityNameKey: "CSGO_Tool_WeaponCase_KeyTag",
  ItemRarityNameKnife: "CSGO_Type_Knife",
  ItemRarityNameMachinegun: "CSGO_Type_Machinegun",
  ItemRarityNameMusicKit: "CSGO_Type_MusicKit",
  ItemRarityNamePatch: "CSGO_Tool_Patch",
  ItemRarityNamePistol: "CSGO_Type_Pistol",
  ItemRarityNameRifle: "CSGO_Type_Rifle",
  ItemRarityNameShotgun: "CSGO_Type_Shotgun",
  ItemRarityNameSMG: "CSGO_Type_SMG",
  ItemRarityNameSniperRifle: "CSGO_Type_SniperRifle",
  ItemRarityNameSticker: "CSGO_Tool_Sticker",
  ItemRarityNameTool: "CSGO_Type_Tool",
  ItemRarityRare: "Rarity_Rare",
  ItemRarityUncommon: "Rarity_Uncommon",
  ItemSwapStatTrakAccept: "SFUI_Accept",
  ItemSwapStatTrakClose: "GameUI_Close",
  ItemSwapStatTrakDesc: "CSGO_tool_stattrak_swap_desc",
  ItemSwapStatTrakUse: "ToolType_stattrak_swap",
  ItemSwapStatTrakWarn: "SFUI_Statrak_Swap_Warning",
  ItemWeaponRarityAncient: "Rarity_Ancient_Weapon",
  ItemWeaponRarityCommon: "Rarity_Common_Weapon",
  ItemWeaponRarityDefault: "Rarity_Default_Weapon",
  ItemWeaponRarityImmortal: "Rarity_Contraband_Weapon",
  ItemWeaponRarityLegendary: "Rarity_Legendary_Weapon",
  ItemWeaponRarityMythical: "Rarity_Mythical_Weapon",
  ItemWeaponRarityRare: "Rarity_Rare_Weapon",
  ItemWeaponRarityUncommon: "Rarity_Uncommon_Weapon",
  ItemWearBS: "SFUI_InvTooltip_Wear_Amount_4",
  ItemWearFN: "SFUI_InvTooltip_Wear_Amount_0",
  ItemWearFT: "SFUI_InvTooltip_Wear_Amount_2",
  ItemWearMW: "SFUI_InvTooltip_Wear_Amount_1",
  ItemWearWW: "SFUI_InvTooltip_Wear_Amount_3",
  RenameCancel: "Cancel_Button",
  RenameEnterName: { token: "popup_nameable_desc", transform: (value) => replace(value, '<b>{s:itemname}</b>', '') },
  RenameRename: { token: "RT_Rn_A", transform: (value) => replace(value, '%s1', '') },
  RenameStorageUnitClose: "GameUI_Close",
  RenameStorageUnitEnterName: { token: "popup_nameable_desc", transform: (value) => replace(value, '<b>{s:itemname}</b>', '') },
  RenameStorageUnitFirstNameWarn: "popup_newcasket_warning",
  RenameStorageUnitNewNameWarn: "popup_yourcasket_warning",
  RenameStorageUnitRename: "popup_newcasket_button",
  RenameStorageUnitUse: "popup_newcasket_title",
  RenameUse: "popup_nameable_title",
  RenameWarn: "popup_nameable_warning",
  ScrapeStickerCancel: "Cancel_Button",
  ScrapeStickerClose: "GameUI_Close",
  ScrapeStickerRemove: "SFUI_InvContextMenu_can_stick_Wear_full_sticker",
  ScrapeStickerRemoveDesc: "SFUI_Sticker_Remove_Desc",
  ScrapeStickerUse: "SFUI_InvContextMenu_can_stick_Wear_sticker",
  ScrapeStickerWarn: { token: "popup_can_stick_scrape_sticker", transform: (value) => replace(value, /<b>\s?\{s:tool_target_name\}\<\/b>/, '') },
  StickerPickerRemove: "Button_Remove",
};

assert(CS2_CSGO_PATH, "CS2_CSGO_PATH must be set.");
const CS2_RESOURCE_PATH = resolve(CS2_CSGO_PATH, "resource");
const LANGUAGE_FILE_RE = /csgo_([^\._]+)\.txt$/;

function readCsgoLanguage(include?: string[]) {
  const languages = {} as Record<string, Record<string, string>>;
  const files = readdirSync(CS2_RESOURCE_PATH);

  for (const file of files) {
    const matches = file.match(LANGUAGE_FILE_RE);
    if (!matches) {
      continue;
    }
    const [, language] = matches;
    if (include !== undefined && !include.includes(language)) {
      continue;
    }
    const contents = readFileSync(resolve(CS2_RESOURCE_PATH, file), "utf-8");
    languages[language] = {};
    const kv = languages[language];
    console.log(`Parsing 'csgo_${language}.txt'...`);
    const parsed = CS_parseValveKeyValue<{
      lang: {
        Tokens: { [key: string]: string };
      };
    }>(contents);
    for (const key of Object.keys(parsed.lang.Tokens)) {
      const k = key.toLowerCase();
      assert(
        kv[k] === undefined,
        `Duplicate key for '${k}' on '${language}' language file.`
      );
      kv[k] = parsed.lang.Tokens[key];
    }
  }
  assert(Object.keys(languages).length > 0);
  assert(languages.english !== undefined);
  return languages;
}

function writeTranslationFile(
  lang: string,
  translations: Record<string, Record<string, string>>
) {
  const translation = translations[lang];
  const dist = `app/translations/${lang}.ts`;
  const sortedKeys = Object.keys(translation).sort();
  // prettier-ignore
  writeFileSync(
    resolve(process.cwd(), dist),
`/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

${lang !== 'english' ? 'import { english } from "./english";\n' : ''}
// prettier-ignore
export const ${lang} = {
${lang !== 'english' ? '  ...english,' : ''}
${sortedKeys.map(key => (
`  ${key}: ${STRINGS_FROM_GAME[key] !== undefined ? `/* csgo_${lang}.txt */` : ''}${JSON.stringify(translation[key])}`
)).join(',\n')}
};`);
  console.log(`Wrote '${dist}'`);
}

async function main() {
  const languages = readCsgoLanguage();
  const langs = [
    "english",
    ...Object.keys(languages).filter((key) => key !== "english")
  ];
  const find = (language: (typeof languages)[string], key: string) =>
    language[key.toLowerCase()];
  const translations: Record<string, Record<string, string>> = {};
  for (const lang of langs) {
    console.log(`Processing '${lang}'...`);
    const language = languages[lang];
    const translationPath = resolve(
      process.cwd(),
      `app/translations/${lang}.ts`
    );
    translations[lang] = (await import(translationPath))[lang];
    const translation = translations[lang];
    for (const [key, value] of Object.entries(STRINGS_FROM_GAME)) {
      if (typeof value === "string") {
        translation[key] = find(language, value) ?? translations.english[key];
      } else if (Array.isArray(value)) {
        translation[key] = value
          .map((token) => {
            if (token.charAt(0) === "#") {
              return (
                find(language, token.substring(1)) ?? translations.english[key]
              );
            }
            return token;
          })
          .join("");
      } else {
        const { token, transform } = value;
        const translated = find(language, token);
        translation[key] =
          translated !== undefined
            ? transform(translated, lang).trim()
            : translations.english[key];
      }
      assert(translation[key] !== undefined, `Missing key '${key}'`);
    }
    if (lang !== "english") {
      for (const key of Object.keys(translation)) {
        if (
          translation[key] === translations.english[key] &&
          !Object.keys(STRINGS_FROM_GAME).includes(key)
        ) {
          delete translation[key];
        }
      }
    }
    writeTranslationFile(lang, translations);
  }
}

main();
