/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2KeyValues, assert } from "@ianlucas/cs2-lib";
import { fail } from "assert";
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { CS2_CSGO_PATH } from "~/env.server";
import { SystemLocalizationByLanguage } from "~/localization.server";

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
  ApplyPatchUse: "popup_can_patch_button",
  ApplyPatchWarn: "SFUI_InvUse_Warning_use_can_stick_patch",
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
  CategoryKeychain: "CSGO_Tool_Keychain",
  CategoryKnife: "CSGO_Type_Knife",
  CategoryMusicKit: "CSGO_Type_MusicKit",
  CategoryPatch: "CSGO_Tool_Patch",
  CategoryPistol: "CSGO_Type_Pistol",
  CategoryRifle: "CSGO_Type_Rifle",
  CategorySMG: "CSGO_Type_SMG",
  CategorySticker: "CSGO_Tool_Sticker",
  CategoryTool: "CSGO_Type_Tool",
  EditorCancel: "Cancel_Button",
  EditorConfirmPick: "UI_Select",
  EditorNametag: "ToolType_name",
  EditorPatches: "inv_nav_patches",
  EditorPick: "matchdraft_vote_status_pick",
  EditorPreview: "SFUI_Store_Preview",
  EditorQuantity: "op_store_column_title_quantity",
  EditorRandom: "SFUI_Map_random",
  EditorReset: "settings_reset",
  EditorSave: "GameUI_Save",
  EditorSeed: "Workshop_Preview_Pattern",
  EditorStatTrak: "CSGO_KillEater_Hud",
  EditorStickerEdit: "Button_Edit_nodots",
  EditorStickerRotation: "Workshop_Preview_Rotation",
  EditorStickers: "Inv_Category_sticker",
  EditorStickerX: "Workshop_Preview_X_Offset",
  EditorStickerY: "Workshop_Preview_Y_Offset",
  EditorWear: "Workshop_Preview_Wear",
  GenericCancel: "Cancel",
  GenericNo: "GameUI_No",
  GenericYes: "GameUI_Yes",
  InspectClose: "GameUI_Close",
  InventoryApplyPatch: "SFUI_InvContextMenu_can_patch",
  InventoryApplySticker: "SFUI_InvContextMenu_can_sticker",
  InventoryFilterAgents: "LoadoutSlot_customplayer",
  InventoryFilterAll: "Inv_Category_any",
  InventoryFilterAllEquipment: "inv_nav_weapons_all",
  InventoryFilterAllGraphicArt: "inv_nav_graphics_all",
  InventoryFilterAlphabetical: "inv_sort_alpha",
  InventoryFilterCharms: "inv_nav_keychain",
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
  InventoryItemDeleteConfirm: "popup_delete_button",
  InventoryItemDeleteConfirmDesc: "popup_delete_desc",
  InventoryItemEdit: "Button_Edit_nodots",
  InventoryItemEquip: "CSGOEcon_Equip",
  InventoryItemExterior: "inv_header_grade",
  InventoryItemInspect: "inv_context_preview",
  InventoryItemInspectFinishCatalog: "SFUI_ItemInfo_FinishCatalog",
  InventoryItemInspectInGame: "CSGO_EconAction_Preview",
  InventoryItemInspectPatternTemplate: "SFUI_ItemInfo_PatternTemplate",
  InventoryItemInspectWearRating: "SFUI_ItemInfo_WearAmount",
  InventoryItemMVPStatTrakCount: ["#KillEaterEventType_OCMVPs", ":"],
  InventoryItemNew: "inv_session_prop_recent",
  InventoryItemRareItem: "Econ_Revolving_Loot_List_Rare_Item",
  InventoryItemRarity: "inv_header_rarity",
  InventoryItemRemovePatch: "popup_remove_patch_button",
  InventoryItemRename: { token: "RT_Rn_A", transform: (value) => replace(value, '%s1', '') },
  InventoryItemRenameClearTooltip: "tooltip_nameable_clear",
  InventoryItemRenameInvalidTooltip: "tooltip_nameable_invalid",
  InventoryItemRenamePlaceholder: "nameable_textentry_placeholder",
  InventoryItemRenameStorageUnit: "inv_context_yourcasket",
  InventoryItemScrapeSticker: "popup_remove_sticker_button",
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
  ItemRarityNameC4: "CSGO_Type_C4",
  ItemRarityNameCharm: "CSGO_Tool_Keychain",
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
  RemovePatchRemove: "SFUI_InvContextMenu_can_stick_Wear_full_patch",
  RemovePatchRemoveDesc: "SFUI_Patch_Remove_Desc",
  RemovePatchUse: "SFUI_Patch_Remove",
  RemovePatchWarn: { token: "popup_can_stick_scrape_full_patch", transform: (value) => replace(value, /<b>\s?\{s:tool_target_name\}\<\/b>/, '') },
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
  SettingsMasterVolume: "SFUI_Settings_Master_Volume",
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
    const parsed = CS2KeyValues.parse<{
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

function writeLocalizationFile(
  lang: string,
  localizations: Record<string, Record<string, string>>
) {
  const localization = localizations[lang];
  const dist = `app/localizations/${lang}.ts`;
  const sortedKeys = Object.keys(localization).sort();
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
`  ${key}: ${STRINGS_FROM_GAME[key] !== undefined ? `/* csgo_${lang}.txt */` : ''}${JSON.stringify(localization[key])}`
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
  const systemLocalizationByLanguage: SystemLocalizationByLanguage = {};
  for (const lang of langs) {
    console.log(`Processing '${lang}'...`);
    const language = languages[lang];
    const localizationPath = resolve(
      process.cwd(),
      `app/localizations/${lang}.ts`
    );
    systemLocalizationByLanguage[lang] = (await import(localizationPath))[lang];
    const localizationMap = systemLocalizationByLanguage[lang];
    for (const [key, value] of Object.entries(STRINGS_FROM_GAME)) {
      if (typeof value === "string") {
        localizationMap[key] =
          find(language, value) ?? systemLocalizationByLanguage.english[key];
      } else if (Array.isArray(value)) {
        localizationMap[key] = value
          .map((token) => {
            if (token.charAt(0) === "#") {
              return (
                find(language, token.substring(1)) ??
                systemLocalizationByLanguage.english[key]
              );
            }
            return token;
          })
          .join("");
      } else {
        const { token, transform } = value;
        const localized = find(language, token);
        localizationMap[key] =
          localized !== undefined
            ? transform(localized, lang).trim()
            : systemLocalizationByLanguage.english[key];
      }
      assert(localizationMap[key] !== undefined, `Missing key '${key}'`);
    }
    if (lang !== "english") {
      for (const key of Object.keys(localizationMap)) {
        if (
          localizationMap[key] === systemLocalizationByLanguage.english[key] &&
          !Object.keys(STRINGS_FROM_GAME).includes(key)
        ) {
          delete localizationMap[key];
        }
      }
    }
    writeLocalizationFile(lang, systemLocalizationByLanguage);
  }
}

main();
